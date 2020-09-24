import * as functions from "firebase-functions";
import { firestore, initializeApp, storage } from "firebase-admin";
import { tmpdir } from "os";
import fetch from "node-fetch";
import { dirname } from "path";
import { unlinkSync, writeFile } from "fs";
import mkdirp = require("mkdirp");

interface Video {
  id: string;
  title: string;
  url: string;
  source: string;
}

interface Slide {
  slideId: string;
  id: string;
  url: string;
  videos: Video[];
}

initializeApp();

export const calcComplexity = functions.firestore
  .document("/rooms/{roomId}")
  .onUpdate(async (snap, _) => {
    const afterValue = snap.after;
    const slides = afterValue.data().slides;
    if (!!slides) {
      return changeSlideUrl(slides, afterValue.id);
    } else {
      return null;
    }
  });

const changeSlideUrl = async (slides: Slide[], roomId: string) => {
  const metadata = {
    cacheControl: "public,max-age=3153600",
    contentType: "image/png",
  };
  const bucket = storage().bucket();
  const uploadTasks: Promise<any>[] = [];
  const newSlides = slides;
  // tslint:disable-next-line: prefer-for-of
  for (let index = 0; index < newSlides.length; index++) {
    const blobApi = await fetch(newSlides[index].url);
    const buff = await blobApi.buffer();
    const slideId = newSlides[index].slideId + "/" + newSlides[index].id;
    const tempLocalFile = `${tmpdir()}/${slideId}.png`;
    const tempLocalDir = dirname(tempLocalFile);
    writeFile(tempLocalFile, buff, (err) => {
      if (!!err) console.error(err);
    });
    uploadTasks.push(
      mkdirp(tempLocalDir)
        .then(() => {
          return bucket.upload(tempLocalFile, {
            destination: `${slideId}.png`,
            metadata,
          });
        })
        .catch((_) => {
          unlinkSync(tempLocalFile);
        })
    );
    const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${newSlides[index].slideId}%2F${newSlides[index].id}.png`;
    newSlides[index].url = newUrl;
  }

  return Promise.all(uploadTasks).then(() => {
    return firestore().collection("rooms").doc(roomId).set(
      {
        slides: newSlides,
      },
      {
        merge: true,
      }
    );
  });
};

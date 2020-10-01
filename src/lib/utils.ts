import cv from "services/cv";
import { SlideDocument } from "lib/model";

export const formatDate = (date: Date, format: string) => {
  format = format.replace(/yyyy/g, "" + date.getFullYear());
  format = format.replace(/MM/g, ("0" + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/dd/g, ("0" + date.getDate()).slice(-2));
  format = format.replace(/HH/g, ("0" + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ("0" + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ("0" + date.getSeconds()).slice(-2));
  format = format.replace(/SSS/g, ("00" + date.getMilliseconds()).slice(-3));
  return format;
};

export const convertRespToSlideDocument = (resp: any[]) => {
  let slides: SlideDocument[] = [];
  for (const slide of resp) {
    slides.push({
      slideId: slide.slideId,
      id: slide.id,
      url: slide.contentUrl,
      videos: slide.video.map(convertVideo),
    });
  }
  return slides;
};

export const convertVideo = (video: any) => {
  return {
    id: video.id,
    url: video.url,
    title: video.title,
    source: video.source,
  };
};

export const calculateComplexity = async (data: ImageData) => {
  const result = await cv.imageComplexity({
    img: data,
    th1: 50,
    th2: 100,
    apSize: 3,
    l2flag: false,
  });
  return result;
};

export const removeHttps = (url: string) => {
  return url.replace("https://", "");
};

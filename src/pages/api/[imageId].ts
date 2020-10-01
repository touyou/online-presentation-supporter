import { NowRequest, NowResponse } from "@vercel/node";
import { calculateComplexity } from "lib/utils";

export default async function (req: NowRequest, res: NowResponse) {
  const {
    query: { imageId },
    headers: { origin },
  } = req;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  const imageUrl = "https://" + imageId[0] + imageId[1];
  console.log(imageUrl);
  const img = new Image();
  img.src = imageUrl;
  img.onload = async (e) => {
    const getImage = (image: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    };

    const result = await calculateComplexity(
      getImage(e.target as HTMLImageElement)
    );
    res.status(200).json({
      value: result.data.payload,
    });
  };
}

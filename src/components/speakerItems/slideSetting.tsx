import React from "react";
import { Box, Stack, Text, Flex, Input, Button } from "@chakra-ui/core";

interface Props {
  onFetchSlides: (resp: any) => void;
  onResetSlides: () => void;
}

const SlideSetting = (props: Props) => {
  const [isAuth, setAuth] = React.useState(false);
  const [slideUrl, setSlideUrl] = React.useState("");
  const [slideId, setSlideId] = React.useState(null);

  React.useEffect(() => {
    if (slideId === null) return;
    gapi.client
      .request({
        path: `https://slides.googleapis.com/v1/presentations/${slideId}`,
      })
      .then((res) => {
        // @ts-ignore
        const httpBatch = gapi.client.newBatch();
        let videoDict = {};
        for (const slide of res.result.slides) {
          const request = gapi.client.request({
            path: `https://slides.googleapis.com/v1/presentations/${slideId}/pages/${slide.objectId}/thumbnail`,
          });
          httpBatch.add(request, {
            id: slide.objectId,
          });
          videoDict[slide.objectId] = slide.pageElements
            .filter((element) => "video" in element)
            .map((element) => {
              let video = element.video;
              video.title = element.title;
              return element.video;
            });
        }
        httpBatch.execute((resp, _) => {
          let results = [];
          for (const slide of res.result.slides) {
            let result = resp[slide.objectId].result;
            result.id = slide.objectId;
            result.video = videoDict[slide.objectId];
            results.push(result);
          }
          props.onFetchSlides(results);
        });
      });
  }, [slideId]);

  const settingSlide = () => {
    if (slideUrl === null) return;
    const regex = new RegExp(
      `(((https|http):\/\/|)docs\.google\.com\/presentation\/d\/)(.+?(?=(\/.+|\/|$)))`
    );
    const match = regex.exec(slideUrl);
    setSlideId(match ? match[4] : null);
  };

  const resetSlide = () => {
    setSlideUrl("");
    setSlideId(null);
    props.onResetSlides();
  };

  return (
    <Box m="4" p="4" borderWidth="2px" rounded="lg">
      <Stack>
        <Text fontSize="xl">Google Slides</Text>
        {isAuth ? (
          <Flex>
            <Input
              placeholder="url"
              mr="2"
              value={slideUrl}
              onChange={(event) => {
                setSlideUrl(event.target.value);
              }}
            />
            <Button variantColor="teal" mr="1" onClick={settingSlide}>
              Set
            </Button>
            <Button variantColor="red" onClick={resetSlide}>
              Stop
            </Button>
          </Flex>
        ) : (
          <Button
            variantColor="teal"
            onClick={() => {
              gapi.load("client:auth2", () => {
                gapi.client
                  .init({
                    apiKey: process.env.GOOGLE_API_KEY,
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    discoveryDocs: [
                      "https://slides.googleapis.com/$discovery/rest?version=v1",
                    ],
                    scope:
                      "https://www.googleapis.com/auth/presentations.readonly",
                  })
                  .then(() => {
                    return gapi.auth2.getAuthInstance().signIn();
                  })
                  .then(() => {
                    setAuth(true);
                  });
              });
            }}
          >
            Authorize
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default SlideSetting;

import React from "react";
import { SlideInfo } from "../pages/room/[rid]";
import {
  Box,
  Stack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/core";
import { updatePlayingVideo, updateCurrentPage } from "../lib/database";

interface Props {
  isListener: boolean;
  roomId: string;
  slideInfo: SlideInfo;
  screenWidth: number;
}

const SlideView = (props: Props) => {
  const [slideInfo, setSlideInfo] = React.useState<SlideInfo>({
    slides: null,
    currentPage: null,
    playingVideo: null,
  });
  const [isSync, setIsSync] = React.useState(true);

  React.useEffect(() => {
    if (isSync) {
      setSlideInfo(props.slideInfo);
    }
  }, [props.slideInfo]);

  const currentSlide = () => {
    return slideInfo.slides[slideInfo.currentPage];
  };

  const videoButton = (videos) => {
    if (videos.length === 0) return null;
    if (videos.length === 1)
      return (
        <Button
          ml={2}
          size="sm"
          onClick={() => {
            if (props.isListener) {
              setSlideInfo({
                ...slideInfo,
                playingVideo: videos[0],
              });
            } else {
              updatePlayingVideo(props.roomId, videos[0]);
            }
          }}
        >
          Video
        </Button>
      );
    return (
      <Menu>
        <MenuButton as={Button} ml={2} size="sm">
          Video
        </MenuButton>
        <MenuList>
          {videos.map((video) => {
            return (
              <MenuItem
                key={video.id}
                onClick={() => {
                  if (props.isListener) {
                    setSlideInfo({
                      ...slideInfo,
                      playingVideo: video,
                    });
                  } else {
                    updatePlayingVideo(props.roomId, video);
                  }
                }}
              >
                {video.title}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    );
  };

  const currentVideoPlayer = () => {
    const slideWidth = props.screenWidth;
    const slideHeight = (slideWidth * 9) / 16;
    const playingVideo = slideInfo.playingVideo;
    if (playingVideo.source === "YOUTUBE") {
      const url =
        "https://www.youtube.com/embed/" + playingVideo.id + "?autoplay=1";
      return (
        <iframe
          src={url}
          width={slideWidth}
          height={slideHeight}
          allow="autoplay"
        ></iframe>
      );
    }
    const url =
      "https://drive.google.com/file/d/" + playingVideo.id + "/preview";
    return (
      <iframe
        src={url}
        width={slideWidth}
        height={slideHeight}
        allow="autoplay"
      />
    );
  };

  const isSyncedListener = () => {
    return props.isListener && isSync;
  };

  return slideInfo.slides !== null ? (
    <Box>
      {!isSyncedListener() ? (
        <Stack isInline mb={2}>
          {videoButton(currentSlide().videos)}
          {slideInfo.playingVideo !== null ? (
            <Button
              ml={2}
              onClick={() => {
                if (props.isListener) {
                  setSlideInfo({
                    ...slideInfo,
                    playingVideo: null,
                  });
                } else {
                  updatePlayingVideo(props.roomId, null);
                }
              }}
              size="sm"
            >
              Stop Video
            </Button>
          ) : null}
        </Stack>
      ) : null}
      {slideInfo.playingVideo !== null ? (
        currentVideoPlayer()
      ) : (
        <img src={currentSlide().url} />
      )}
      {!isSyncedListener() ? (
        <Stack isInline justify="space-between" ml={2} mr={2} mt={2}>
          <IconButton
            aria-label="back slide"
            icon="arrow-back"
            onClick={() => {
              const currentPage = slideInfo.currentPage;
              if (currentPage > 0) {
                if (!props.isListener) {
                  if (slideInfo.playingVideo !== null) {
                    updatePlayingVideo(props.roomId, null);
                  }
                  updateCurrentPage(props.roomId, currentPage - 1);
                } else {
                  console.log(slideInfo);
                  setSlideInfo({
                    ...slideInfo,
                    currentPage: currentPage - 1,
                    playingVideo: null,
                  });
                }
              }
            }}
          />
          {props.isListener ? (
            <Button
              onClick={() => {
                setIsSync(true);
                setSlideInfo(props.slideInfo);
              }}
            >
              発表者と同期
            </Button>
          ) : null}
          <IconButton
            aria-label="forward slide"
            icon="arrow-forward"
            onClick={() => {
              const currentPage = slideInfo.currentPage;
              if (currentPage < slideInfo.slides.length - 1) {
                if (!props.isListener) {
                  if (slideInfo.playingVideo !== null) {
                    updatePlayingVideo(props.roomId, null);
                  }
                  updateCurrentPage(props.roomId, currentPage + 1);
                } else {
                  setSlideInfo({
                    ...slideInfo,
                    currentPage: currentPage + 1,
                    playingVideo: null,
                  });
                }
              }
            }}
          />
        </Stack>
      ) : (
        <Button
          onClick={() => {
            setIsSync(false);
          }}
        >
          同期解除
        </Button>
      )}
    </Box>
  ) : (
    <div></div>
  );
};

export default SlideView;

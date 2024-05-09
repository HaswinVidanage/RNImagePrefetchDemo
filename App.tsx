import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import RNFS from "react-native-fs";
// @ts-ignore
import Reactotron from "reactotron-react-native/src";

Reactotron.configure().useReactNative().connect();

const DummyImages = [
  "https://dummyimage.com/600x400/000/fff&text=01",
  "https://dummyimage.com/600x400/000/fff&text=02",
  "https://dummyimage.com/600x400/000/fff&text=03",
  "https://dummyimage.com/600x400/000/fff&text=04",
  "https://dummyimage.com/600x400/000/fff&text=05",
  "https://dummyimage.com/600x400/000/fff&text=06",
  "https://dummyimage.com/600x400/000/fff&text=07",
  "https://dummyimage.com/600x400/000/fff&text=08",
];

const HTTP_DOWNLOAD_LABEL = "http";
const CACHED_LABEL = "cached";

// todo fix the cache glitch
const App = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [localImageURIs, setLocalImageURIs] = useState([]);
  const [sourceLabels, setSourceLabels] = useState([]);

  useEffect(() => {
    preloadImages();
    return () => {
      clearCache();
    };
  }, []);

  const preloadImages = async () => {
    try {
      // Initialize the labels as "Downloaded" if the file needs to be downloaded
      setSourceLabels(DummyImages.map(() => HTTP_DOWNLOAD_LABEL));

      const urisAndLabels = await Promise.all(
        DummyImages.map(async (uri, index) => {
          const localFilePath = `${RNFS.TemporaryDirectoryPath}/image_${index}.jpg`;
          const fileExists = await RNFS.exists(localFilePath);

          if (!fileExists) {
            // If the file does not exist, download and initially mark it as downloaded
            await RNFS.downloadFile({
              fromUrl: uri,
              toFile: localFilePath,
            }).promise;
          }

          // Update the label to "Cached" immediately after confirming it exists or after downloading
          setSourceLabels((prevLabels) =>
            prevLabels.map((label, labelIndex) =>
              labelIndex === index ? "Cached" : label
            )
          );

          return {
            localURI: localFilePath,
            label: fileExists ? CACHED_LABEL : HTTP_DOWNLOAD_LABEL,
          };
        })
      );

      setLocalImageURIs(urisAndLabels.map((item) => item.localURI));
      setImagesLoaded(true);
    } catch (error) {
      console.error("Error preloading images:", error);
    }
  };

  const getImageSource = (index: number): string => {
    const localURI = localImageURIs[index];
    return localURI ? `file://${localURI}` : DummyImages[index];
  };

// we can improve the handle download function to fetch the image from the source if it does not exist
  const handleDownload = async (index: number) => {
    try {
      const localURI = localImageURIs[index];
      const downloadDir = `${RNFS.DownloadDirectoryPath}`;
      const fileName = `image_${index}.jpg`;
      const downloadPath = `${downloadDir}/${fileName}`;

      await RNFS.copyFile(localURI, downloadPath);

      console.log("Image copied to downloads folder:", downloadPath);
    } catch (error) {
      console.error("Error saving image:", error);
    }
  };

  const downloadAllImages = async () => {
    try {
      const downloadDir = `${RNFS.DownloadDirectoryPath}`;
      const directoryExists = await RNFS.exists(downloadDir);
      if (!directoryExists) {
        await RNFS.mkdir(downloadDir);
      }

      await Promise.all(
        localImageURIs.map(async (uri, index) => {
          const fileName = `image_${index}.jpg`;
          const downloadPath = `${downloadDir}/${fileName}`;
          await RNFS.copyFile(uri, downloadPath);
        })
      );

      console.log("All images copied to downloads folder");
    } catch (error) {
      console.log("Error downloading all images:", error);
    }
  };

  const clearCache = async () => {
    try {
      const promises = localImageURIs.map((uri) => RNFS.unlink(uri));
      await Promise.all(promises);
      console.log("Cache cleared successfully");
      setSourceLabels(Array(sourceLabels.length).fill(HTTP_DOWNLOAD_LABEL));
    } catch (error) {
      console.error("Failed to clear cache:", error);
    } finally {
      preloadImages();
    }
  };

  return (
    <View style={styles.fullScreen}>
      <View style={styles.header}>
        <Button
          title="Download All"
          onPress={downloadAllImages}
          color="green"
        />
        <Button title="Clear Cache" onPress={clearCache} color="red" />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {imagesLoaded ? (
          localImageURIs.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image
                source={{ uri: getImageSource(index) }}
                style={styles.image}
                resizeMode="cover"
              />
              <Text style={styles.label}>{sourceLabels[index]}</Text>
              <TouchableOpacity onPress={() => handleDownload(index)}>
                <Text style={styles.downloadButton}>
                  {getImageSource(index)}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text>Loading...</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f0f0f0",
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  container: {
    paddingTop: 60,
    paddingBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    flexDirection: "row",
  },
  imageContainer: {
    width: "25%",
    padding: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
  },
  downloadButton: {
    marginTop: 5,
    color: "blue",
    textDecorationLine: "underline",
    fontSize: 12,
  },
  label: {
    color: "green",
    fontSize: 14,
  },
});

export default App;

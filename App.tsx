import React, {useEffect, useState} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import RNFS from 'react-native-fs';
// @ts-ignore
import Reactotron from 'reactotron-react-native/src';

Reactotron.configure().useReactNative().connect();

const DummyImages = [
  'https://dummyimage.com/600x400/000/fff&text=Image+1',
  'https://dummyimage.com/600x400/000/fff&text=Image+2',
  'https://dummyimage.com/600x400/000/fff&text=Image+3',
];

const App = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [localImageURIs, setLocalImageURIs] = useState([]);

  useEffect(() => {
    preloadImages();
  }, []);

  const preloadImages = async () => {
    try {
      const promises = DummyImages.map(async (uri, index) => {
        const localFilePath = `${RNFS.TemporaryDirectoryPath}/image_${index}.jpg`;
        await RNFS.downloadFile({fromUrl: uri, toFile: localFilePath}).promise;
        return localFilePath;
      });

      const localURIs = await Promise.all(promises);
      setLocalImageURIs(localURIs);
      setImagesLoaded(true);
    } catch (error) {
      console.error('Error preloading images:', error);
    }
  };

  const handleDownload = async (index: number) => {
    try {
      const localURI = localImageURIs[index];
      console.log(`localURI: ${localURI}`);
      if (!localURI) {
        console.error('Local URI not found for image index:', index);
        return;
      }

      console.log('localURI: ', localURI);

      const downloadDir = `${RNFS.DownloadDirectoryPath}`;
      const fileName = `image_${index}.jpg`;
      const downloadPath = `${downloadDir}/${fileName}`;

      const directoryExists = await RNFS.exists(downloadDir);
      if (!directoryExists) {
        await RNFS.mkdir(downloadDir);
      }

      const response = await RNFS.downloadFile({
        fromUrl: DummyImages[index],
        toFile: downloadPath,
      }).promise;

      if (response.statusCode === 200) {
        console.log('Image downloaded successfully:', downloadPath);
      } else {
        console.error('Failed to download image:', response);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <View style={styles.container}>
      {imagesLoaded ? (
        DummyImages.map((uri, index) => (
          <View key={index}>
            <Image source={{uri}} style={styles.image} resizeMode="cover" />
            <TouchableOpacity onPress={() => handleDownload(index)}>
              <Text style={styles.downloadButton}>Download Image</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View>
          <Text>Loading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  downloadButton: {
    marginTop: 5,
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default App;

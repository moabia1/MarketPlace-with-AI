const ImageKit = require("imagekit");
const {v4 : uuidv4} = require("uuid")

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});


async function uploadImage({buffer, filename, folder = "/products"}) {
    const res = await imageKit.upload({
      file: buffer,
      fileName: uuidv4(),
      folder
    });
    return {
      url: res.url,
      thumbnail: res.thumbnail || res.url,
      id: res.fileId,
    };
}

module.exports = {
  uploadImage,
};

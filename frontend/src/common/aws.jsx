import axios from "axios";

const fileUpload = async (file) => {
  let formData = new FormData();
  await formData.append("image", file);
  let resultOfUpload = null;

  await axios
    .post(`http://localhost:3000/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => {
      resultOfUpload = res.data;
    });

  return resultOfUpload;
};

export default fileUpload;

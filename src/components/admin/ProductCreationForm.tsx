import { useState } from "react";

import ReactImageGallery from "react-image-gallery";

import { SpinnerCircular } from "spinners-react";

import styled from "styled-components";

import { createProduct, uploadProductPicture } from "../../api";

import { postApiFormData, postApiJson } from "../../controllers/APICtrl";

import { sendMiniMessage } from "../../controllers/MessageCtrl";

const ProductCreationForm = ({
  allowAdmin,
  setProductView,
}: {
  allowAdmin: string;
  setProductView: any;
}) => {
  const [imageArray, setImageArray] = useState([]);

  const [loadingText, setLoadingText] = useState("");

  const sendProductCreationForm = async (e: any) => {
    e.preventDefault();

    // Save product
    const form = e.target as HTMLFormElement;

    const productData = {
      title: form["elpis-adap-ptitle"].value,

      description: form["elpis-adap-pdesc"].value,

      price: parseInt(form["elpis-adap-pprice"].value),

      section: form["elpis-adap-psect"].value,
    };

    setLoadingText("Saving Product Data");

    const creationData = await postApiJson(
      createProduct(allowAdmin),
      productData,
    );

    if (creationData.error) {
      sendMiniMessage(
        {
          icon: { name: "times", style: {} },

          content: { text: "An Error Occured!", style: {} },
        },
        2000,
      );
    } else {
      // add pictures

      let good = 0,
        bad = 0;

      const files = form["elpis-adap-pics"].files;

      for await (const picture of files) {
        setLoadingText(`Saving Image (${good + bad + 1})`);

        const pictureSaveData = await postApiFormData(
          uploadProductPicture(allowAdmin, creationData._id),
          { picture },
        );

        if (pictureSaveData.error) {
          bad++;
        } else {
          good++;
        }
      }

      sendMiniMessage(
        {
          icon: { name: "info" },

          content: { text: `${good} Saved, ${bad} Failed` },
        },
        2000,
      );
    }

    form.reset();

    setLoadingText("");

    setImageArray([]);
  };

  const handleImageInput = (e: any) => {
    const files = e.target.files;

    setImageArray([]);

    let allImages: any = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const reader = new FileReader();

      reader.onloadend = () => {
        allImages.push({
          original: reader.result,

          thumbnail: reader.result,

          originalHeight: 300,
          thumbnailHeight: 80,
        });

        // @ts-ignore
        setImageArray(allImages);
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <ProductCreationFormStyle>
      <form onSubmit={sendProductCreationForm}>
        <div className="form-pack">
          <label htmlFor="elpis-adap-ptitle">Product Title</label>

          <div>
            <input
              required
              type="text"
              id="elpis-adap-ptitle"
              name="elpis-adap-ptitle"
              placeholder="The title of the product"
              autoComplete="elpis-adap-ptitle"
            />
          </div>
        </div>

        <div className="form-pack">
          <label htmlFor="elpis-adap-pdesc">Product Description</label>

          <div>
            <textarea
              required
              id="elpis-adap-pdesc"
              name="elpis-adap-pdesc"
              placeholder="The description of the product"
              autoComplete="elpis-adap-pdesc"
            />
          </div>
        </div>

        <div className="form-pack">
          <label htmlFor="elpis-adap-pprice">Product Price</label>

          <div>
            <input
              required
              type="number"
              id="elpis-adap-pprice"
              name="elpis-adap-pprice"
              placeholder="50"
              min={1}
              autoComplete="elpis-adap-pprice"
            />
          </div>
        </div>

        <div className="form-pack rrd">
          <div className="rad">
            <label htmlFor="elpis-adap-psect-l">Cloth</label>

            <input
              type="radio"
              name="elpis-adap-psect"
              id="elpis-adap-psect-l"
              value="Cloth"
              defaultChecked
            />
          </div>

          <div className="rad">
            <label htmlFor="elpis-adap-psect-s">Shoe</label>

            <input
              type="radio"
              name="elpis-adap-psect"
              id="elpis-adap-psect-s"
              value="Shoe"
            />
          </div>

          <div className="rad">
            <label htmlFor="elpis-adap-psect-c">Cosmetic</label>

            <input
              type="radio"
              name="elpis-adap-psect"
              id="elpis-adap-psect-c"
              value="Cosmetic"
            />
          </div>
        </div>

        <div className="form-pack">
          <label htmlFor="elpis-adap-pprice">Product Pictures</label>

          <div className="pics">
            <ReactImageGallery
              items={imageArray}
              showIndex={true}
              showThumbnails={true}
              showBullets={true}
              showFullscreenButton={false}
            />
          </div>

          <div className="fila">
            <span>Choose Pictures</span>

            <input
              type="file"
              name="elpis-adap-pics"
              id="elpis-adap-pics"
              multiple
              accept="image/png, image/jpg, image/jpeg"
              onInput={handleImageInput}
            />
          </div>
        </div>

        <div className="end-pack">
          <button type={"submit"}>Create Product</button>
        </div>

        <div className="end-pack">
          <button
            type="button"
            className="rxtd"
            onClick={() => setProductView("")}
          >
            Go Back
          </button>
        </div>
      </form>

      {loadingText !== "" && (
        <div className="abs-form">
          <div>
            <SpinnerCircular size="7pc" color="#fff" />

            {loadingText}
          </div>
        </div>
      )}
    </ProductCreationFormStyle>
  );
};

const ProductCreationFormStyle = styled.div`
  width: 100%;

  form {
    width: 80%;
    margin: 0 auto;
    padding: 1pc 0;
    z-index: 10;

    .form-pack {
      width: 100%;
      display: flex;
      flex-direction: column;
      padding-bottom: 1pc;

      &.rrd {
        flex-direction: row;

        .rad {
          padding: 1pc;
          display: flex;
        }

        label {
          cursor: pointer;
        }

        input {
          width: auto;
          border-radius: 0.2rem;
          margin-left: 0.5pc;
          transition: background-color 0.5s;
          box-shadow: 0 0 0;
        }
      }

      label {
        font-weight: bold;
      }

      input,
      textarea {
        background-color: #f6f6f6;
        padding: 0.2rem 0.5rem;
        border: 0 none;
        outline: 0 none;
        width: 100%;
        border-radius: 0.2rem;
        padding-right: 2rem;
        transition: background-color 0.5s;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
      }

      textarea {
        height: 5pc;
      }

      .icon-hol {
        width: 1.8rem;
        cursor: pointer;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .valid-text {
        line-height: 1rem;
        position: absolute;
        top: calc(100% - 0.3rem);
        left: 0%;
        width: 100%;
        text-align: center;
        font-size: 0.7pc;
      }

      &.good {
        input {
          background-color: #c6e0c6;
        }

        .valid-text {
          color: green;
        }
      }

      &.bad {
        input {
          background-color: #f4c6c6;
        }

        .valid-text {
          color: red;
        }
      }

      .pics {
        width: 100%;
        background-color: rgba(0, 0, 0, 0.01);
        background: radial-gradient(
          rgba(0, 0, 0, 0.2),
          transparent,
          transparent
        );

        padding-bottom: 1pc;
        overflow: hidden;
        margin-bottom: 1pc;
      }

      .fila {
        display: flex;
        width: 100%;
        background-color: #3c73e9;
        border: 0 none;
        outline: 0 none;
        color: white;
        border-radius: 0.2rem;
        padding: 0 0.5rem;
        cursor: pointer;
        transition: background-color 0.5s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background-color: #173167;
        }

        input {
          position: absolute;
          top: 0%;
          bottom: 0%;
          left: 0%;
          right: 0%;
          width: 100%;
          opacity: 0;
          height: 100%;
          z-index: 15;
          cursor: pointer;
          display: block;
        }
      }
    }

    .end-pack {
      padding-top: 0.75rem;

      button {
        width: 100%;
        background-color: #3c73e9;
        border: 0 none;
        outline: 0 none;
        color: white;
        border-radius: 0.2rem;
        padding: 0 0.5rem;
        cursor: pointer;
        transition: background-color 0.5s;
        display: flex;
        align-items: center;
        justify-content: center;

        &.rxtd {
          background-color: #6e1c1c;

          &:hover {
            background-color: #290808;
          }
        }

        span {
          display: inline-block;
          padding-right: 0.3rem;
        }

        &:hover {
          background-color: #173167;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &:disabled:hover {
          background-color: #3c73e9;
        }
      }
    }
  }

  .abs-form {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 12;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    div {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      font-size: 1.5pc;
      line-height: 3pc;
    }
  }
`;

export default ProductCreationForm;

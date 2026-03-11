import { useState } from "react";

import styled from "styled-components";

import { deleteProduct, getProductbyTitle } from "../../api";

import { deleteApiJson, getApiJson } from "../../controllers/APICtrl";

import { sendMiniMessage } from "../../controllers/MessageCtrl";

import ProductCreationForm from "./ProductCreationForm";

import ProductUpdateForm from "./ProductUpdateForm";

const AdminActions = ({ allowAdmin }: { allowAdmin: string }) => {
  const [productView, setProductView] = useState("");

  const [productData, setProductData] = useState({});

  const updateProduct = async (e: any) => {
    e.preventDefault();

    setProductData({});

    const form = e.target as HTMLFormElement;

    const title = form["adap-product-name"].value;

    form.reset();

    sendMiniMessage(
      {
        icon: { name: "loading", style: {} },

        content: { text: "Searching for Product", style: {} },
      },
      2000,
    );

    const fetchProductData = await getApiJson(getProductbyTitle(title));

    if (fetchProductData.error) {
      sendMiniMessage(
        {
          icon: { name: "times", style: {} },

          content: { text: "Product not found!", style: {} },
        },
        2000,
      );
    } else {
      sendMiniMessage(
        {
          icon: { name: "ok", style: {} },

          content: { text: "Product Found!", style: {} },
        },
        2000,
      );

      setProductData(fetchProductData);

      setProductView("update");
    }
  };

  const deleteProductX = async (e: any) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;

    const title = form["adap-product-name"].value;

    form.reset();

    sendMiniMessage(
      {
        icon: { name: "loading", style: {} },

        content: { text: "Searching for Product", style: {} },
      },
      2000,
    );

    const fetchProductData = await getApiJson(getProductbyTitle(title));

    if (fetchProductData.error) {
      sendMiniMessage(
        {
          icon: { name: "times", style: {} },

          content: { text: "Product not found!", style: {} },
        },
        2000,
      );
    } else {
      sendMiniMessage({
        icon: { name: "loading", style: {} },

        content: { text: "Deleting Product!", style: {} },
      });

      const deleteProductData = await deleteApiJson(
        deleteProduct(allowAdmin, fetchProductData._id),
      );

      if (deleteProductData.error) {
        sendMiniMessage(
          {
            icon: { name: "times", style: {} },

            content: { text: "Product Deletion Failed!", style: {} },
          },
          2000,
        );
      } else {
        sendMiniMessage(
          {
            icon: { name: "ok", style: {} },

            content: { text: "Product Deleted!", style: {} },
          },
          2000,
        );
      }
    }
  };

  if (productView === "") {
    return (
      <AdminActionsStyle>
        <div className="a-pack">
          <button onClick={() => setProductView("create")}>
            Create Product
          </button>
        </div>

        <form className="a-pack" onSubmit={updateProduct}>
          <input
            type="text"
            required
            autoComplete="adap-product-name"
            name="adap-product-name"
            placeholder="Product Name"
          />

          <button>Update Product</button>
        </form>

        <form className="a-pack" onSubmit={deleteProductX}>
          <input
            type="text"
            required
            autoComplete="adap-product-name"
            name="adap-product-name"
            placeholder="Product Name"
          />

          <button>Delete Product</button>
        </form>
      </AdminActionsStyle>
    );
  } else if (productView === "create") {
    return <ProductCreationForm {...{ allowAdmin, setProductView }} />;
  } else if (productView === "update") {
    return (
      <ProductUpdateForm {...{ allowAdmin, setProductView, productData }} />
    );
  } else return <>productView: {productView}</>;
};

const AdminActionsStyle = styled.div`
  width: 100%;

  .a-pack {
    margin: 1pc auto;
    padding: 1.5pc;
    width: 80vw;
    color: #fff;
    background-color: #f5f5f5;
    border-radius: 1.5pc;
    /* background-color: #1b223a; */
    display: flex;
    align-items: center;
    justify-content: baseline;
    flex-direction: column;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);

    input {
      margin-bottom: 1pc;

      background-color: #dddddd;
      text-align: center;
      padding: 0.2rem 0.5rem;
      border: 0 none;
      outline: 0 none;
      width: 100%;
      border-radius: 0.2rem;
      padding-right: 2rem;
      transition: background-color 0.5s;
    }

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
`;

export default AdminActions;

import styled from "styled-components";

import AbsoluteProduct from "../product/AbsoluteProduct";

import FilterQuery from "./SectionParts/FilterQuery";

import ProductList from "./SectionParts/ProductList";

import ReturnQuery from "./SectionParts/ReturnQuery";

const IndexSection = () => {
  return (
    <IndexSectionStyle>
      <div className="i-s-container">
        <ReturnQuery />
        <FilterQuery />
        <ProductList />
        <AbsoluteProduct />
      </div>
    </IndexSectionStyle>
  );
};

const IndexSectionStyle = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  animation: opacity-in 0.5s ease-in 1;
  width: 100%;
  flex: 1;

  .i-s-container {
    width: 100%;
    max-width: 1500px;
    margin: 0 auto;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
  }
`;

export default IndexSection;

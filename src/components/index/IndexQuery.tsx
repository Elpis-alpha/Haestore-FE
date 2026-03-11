import { Link } from "react-router-dom";

import styled from "styled-components";

import { SpinnerCircular as Spinner } from "spinners-react";

import { siteName } from "../../__env";

import { createQueryString, reformImage } from "../../controllers/SpecialCtrl";

const IndexQuery = () => {
  return (
    <IndexQueryStyle>
      <div className="i-q-container">
        <div className="product-list">
          <div className="product-container" data-section-name="All">
            <Link
              to={createQueryString({ view: "section:all", count: 10 })}
              title={"Combination of all sections in " + siteName}
            >
              <div className="product-inner">
                <div className="left-side">
                  <h4>All</h4>

                  <small>The Complete Store</small>
                </div>

                <div className="right-side">
                  <img
                    src="/images/products/blur/all.png"
                    alt={"Combination of all sections in " + siteName}
                    title={"Combination of all sections in " + siteName}
                    onLoad={reformImage}
                  />

                  <div className="dis-spinner">
                    <Spinner color="white" secondaryColor="#aaa" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="product-container" data-section-name="Cloth">
            <Link
              to={createQueryString({ view: "section:cloth", count: 10 })}
              title={"Clothes section in " + siteName}
            >
              <div className="product-inner">
                <div className="left-side">
                  <h4>Clothes</h4>

                  <small>Dazzling Fabrics</small>
                </div>

                <div className="right-side">
                  <img
                    src="/images/products/blur/cloth-2.jpg"
                    alt={"Clothes section in " + siteName}
                    title={"Clothes section in " + siteName}
                    onLoad={reformImage}
                  />

                  <div className="dis-spinner">
                    <Spinner color="white" secondaryColor="#aaa" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="product-container" data-section-name="Shoe">
            <Link
              to={createQueryString({ view: "section:shoe", count: 10 })}
              title={"Shoes section in " + siteName}
            >
              <div className="product-inner">
                <div className="left-side">
                  <h4>Shoes</h4>

                  <small>Exotic Footwears</small>
                </div>

                <div className="right-side">
                  <img
                    src="/images/products/blur/shoe-2.jpg"
                    alt={"Shoes section in " + siteName}
                    title={"Shoes section in " + siteName}
                    onLoad={reformImage}
                  />

                  <div className="dis-spinner">
                    <Spinner color="white" secondaryColor="#aaa" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="product-container" data-section-name="Cosmetic">
            <Link
              to={createQueryString({ view: "section:cosmetic", count: 10 })}
              title={"Cosmetics section in " + siteName}
            >
              <div className="product-inner">
                <div className="left-side">
                  <h4>Cosmetics</h4>

                  <small>Exquisite Maquillage</small>
                </div>

                <div className="right-side">
                  <img
                    src="/images/products/blur/cos-5.jpg"
                    alt={"Cosmetics section in " + siteName}
                    title={"Cosmetics section in " + siteName}
                    onLoad={reformImage}
                  />

                  <div className="dis-spinner">
                    <Spinner color="white" secondaryColor="#aaa" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </IndexQueryStyle>
  );
};

const IndexQueryStyle = styled.div`
  display: flex;
  align-items: center;
  margin: 5vh auto;
  width: 100%;
  animation: scale-in 0.5s ease-in 1;

  .i-q-container {
    margin: auto;
    width: 100%;
    max-width: 1200px;

    .intro {
      padding: 0 1rem;
      text-align: center;

      @media screen and (max-width: 700px) {
        padding-bottom: 0.5rem;
      }
    }

    .product-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      width: 100%;
      margin: 0 auto;
      padding: 0 1rem;
      padding: 3rem;

      .product-container {
        width: 100%;

        a {
          height: 100%;
          color: inherit;
          text-decoration: none;
          display: block;
          border-radius: 1rem;
          overflow: hidden;
          /* border: 1px solid black; */

          background: linear-gradient(145deg, #e6e6e6, #ffffff);
          box-shadow:
            8px 8px 16px #c7c7c7,
            0 0 0px #ffffff;

          &:hover {
            .product-inner {
              .left-side {
                width: 100%;
              }

              .right-side {
                margin-left: 100%;
                margin-right: -60%;
              }
            }
          }
        }

        .product-inner {
          display: flex;
          height: 100%;

          .left-side {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 40%;
            z-index: 10;
            transition: width 0.5s;
            padding: 0.5rem 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            text-align: center;

            small {
              font-size: 0.8pc;
              line-height: 1.5pc;

              @media screen and (max-width: 800px) {
                font-size: 0.7pc;
              }
            }
          }

          .right-side {
            z-index: 5;
            width: 100%;
            margin-left: 40%;
            margin-right: 0%;
            transition:
              margin-left 0.5s,
              margin-right 0.5s;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 5;
            }

            .dis-spinner {
              position: absolute;
              z-index: 10;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.5;
            }
          }
        }

        @media screen and (max-width: 700px) {
          width: 100%;
        }
      }
    }

    @media screen and (max-width: 1200px) {
    .product-list {
      gap: 2rem;
      padding: 4rem;
    }
    }

    @media screen and (max-width: 700px) {
    .product-list {
      max-width: 500px;
      margin: 0 auto;
      grid-template-columns: 1fr;
      gap: 3rem;
      padding: 2rem;
    }
    }

    @media screen and (max-width: 500px) {
      h2 {
        font-size: 1.5pc;
        line-height: 2pc;
      }

      h4 {
        font-size: 1pc;
        line-height: 2pc;
      }

      small {
        font-size: 0.7pc;
        line-height: 2pc;
      }
    }
  }
`;

export default IndexQuery;

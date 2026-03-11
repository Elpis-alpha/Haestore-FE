import styled from "styled-components";

import { useState } from "react";

import { SpinnerCircular as Loader } from "spinners-react";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import Cookies from "universal-cookie";

import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../api";

import { postApiJson } from "../controllers/APICtrl";

import { useDispatch } from "react-redux";

import { setUserData } from "../store/slice/userSlice";

import { sendMiniMessage } from "../controllers/MessageCtrl";

import { siteName, tokenCookieName } from "../__env";
import { setRefetchCart } from "../store/slice/cartSlice";

const LoginPage = () => {
  const cookie = new Cookies();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formStatus, setFormStatus] = useState("filling"); // filling, sending, sent

  const [formEmail, setFormEmail] = useState("");

  const [formPass, setFormPass] = useState("");

  const loginUserX = async (e: any) => {
    e.preventDefault();

    const form = e.currentTarget;

    setFormStatus("sending");

    if (formEmail.trim().length < 1) {
      form["elpis-adap-email"].focus();
      return setFormStatus("filling");
    }

    if (formPass.trim().length < 1) {
      form["elpis-adap-pass"].focus();
      return setFormStatus("filling");
    }

    const userLoginData = await postApiJson(loginUser(), {
      email: formEmail,
      password: formPass,
    });

    if (userLoginData.error) {
      sendMiniMessage(
        {
          icon: { name: "times", style: {} },

          content: { text: "Invalid Credentials!", style: {} },

          style: {},
        },
        2000,
      );

      form["elpis-adap-email"].focus();
      return setFormStatus("filling");
    } else {
      dispatch(
        setUserData({ ...userLoginData.user, token: userLoginData.token }),
      );

      dispatch(setRefetchCart(true));

      cookie.set(tokenCookieName, userLoginData.token, {
        path: "/",
        expires: new Date(90 ** 7),
      });

      setFormStatus("sent");

      navigate("/");
    }
  };

  return (
    <LoginPageStyle>
      <div className="page-container">
        <div className="intro">
          <h1>Welcome back</h1>

          <p>
            {siteName} is waiting for you, these goods aren't buying themselves.
          </p>
        </div>

        <div className="form">
          <form onSubmit={loginUserX}>
            <div className="form-pack">
              <label htmlFor="elpis-adap-email">Email</label>

              <div>
                <input
                  required
                  type="email"
                  id="elpis-adap-email"
                  name="elpis-adap-email"
                  placeholder="Enter your email here"
                  value={formEmail}
                  onInput={(e) => setFormEmail(e.currentTarget.value)}
                  autoComplete="elpis-adap-email"
                />
              </div>
            </div>

            <div className="form-pack">
              <label htmlFor="elpis-adap-pass">Password</label>

              <div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  id="elpis-adap-pass"
                  name="elpis-adap-pass"
                  placeholder="••••••••••"
                  value={formPass}
                  onInput={(e) => setFormPass(e.currentTarget.value)}
                  autoComplete="elpis-adap-pass"
                />

                <div className="icon-hol">
                  {getPasswordIcon(showPassword, setShowPassword)}
                </div>
              </div>
            </div>

            <div className="but-pack">
              <button disabled={formStatus !== "filling"}>
                <span>Login</span>{" "}
                {formStatus === "sending" && (
                  <Loader color="white" secondaryColor="#ccc" size="1rem" />
                )}
              </button>
            </div>
          </form>

          <span className="al--dfoouds">
            New here? <Link to="/signup">Create an account</Link>
          </span>
        </div>
      </div>
    </LoginPageStyle>
  );
};

const LoginPageStyle = styled.div`
  animation: opacity-in 0.5s ease-in 1;
  min-width: 100%;
  /* margin: 0 auto; */
  flex: 1;
  display: flex;
  align-items: center;
  /* justify-content: center; */
  flex-direction: column;

  .page-container {
    width: 80%;
    margin: auto;
    max-width: 900px;
  }

  .intro {
    padding-bottom: 0.5rem;
  }

  .form-pack {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-bottom: 0.5rem;

    label {
      font-weight: bold;
    }

    input {
      background-color: #e5e5e5;
      padding: 0.2rem 0.5rem;
      border: 0 none;
      outline: 0 none;
      width: 100%;
      border-radius: 0.2rem;
      padding-right: 2rem;
      transition: background-color 0.5s;
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
  }

  .but-pack {
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

  .al--dfoouds {
    width: 100%;
    text-align: center;
    padding-top: 0.8rem;
    display: block;

    .glow-me {
      color: #3c73e9;
      text-decoration: underline;
      cursor: pointer;
    }
  }
`;

const getPasswordIcon = (
  showPassword: boolean,
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  switch (showPassword) {
    case true:
      return (
        <FaEyeSlash
          size="1.2rem"
          onClick={() => setShowPassword(!showPassword)}
        />
      );

    case false:
      return (
        <FaEye size="1.2rem" onClick={() => setShowPassword(!showPassword)} />
      );

    default:
      return <></>;
  }
};

export default LoginPage;

import styled from "styled-components";

import { useState } from "react";

import { SpinnerCircular as Loader } from "spinners-react";

import { FaEye, FaEyeSlash, FaCheck, FaTimes } from "react-icons/fa";

// @ts-ignore
import { isEmail } from "validator";

import Cookies from "universal-cookie";

import { Link, useNavigate } from "react-router-dom";

import { addClass, removeClass } from "../controllers/UICtrl";

import { userExistence, createUser } from "../api";

import { getApiJson, postApiJson } from "../controllers/APICtrl";

import { useDispatch } from "react-redux";

import { setUserData } from "../store/slice/userSlice";

import { sendMiniMessage } from "../controllers/MessageCtrl";

import { siteName, tokenCookieName } from "../__env";

import { setRefetchCart } from "../store/slice/cartSlice";

const SignupPage = () => {
  const cookie = new Cookies();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [emailStatus, setEmailStatus] = useState("unverified"); // unverified, valid, invaliid, checking

  const [formStatus, setFormStatus] = useState("filling"); // filling, sending, sent

  const [formName, setFormName] = useState("");

  const [formEmail, setFormEmail] = useState("");

  const [formPass, setFormPass] = useState("");

  const validateName = (e: any) => {
    const input = e.currentTarget as HTMLInputElement;

    const text = input.value.trim();

    setFormName(input.value);

    if (!input.parentElement) return false;

    if (text.length < 1) {
      removeClass(input.parentElement, "good");

      addClass(input.parentElement, "bad");

      // @ts-ignore
      input.nextElementSibling.innerText = "Name is too short";
    } else {
      removeClass(input.parentElement, "bad");

      addClass(input.parentElement, "good");

      // @ts-ignore
      input.nextElementSibling.innerText = "";
    }
  };

  const validateEmail = (e: any) => {
    const input = e.currentTarget;

    const text = input.value.trim();

    setFormEmail(input.value);

    setEmailStatus("unverified");

    if (isEmail(text)) {
      removeClass(input.parentElement.parentElement, "bad");

      addClass(input.parentElement.parentElement, "good");

      input.parentElement.nextElementSibling.innerText = "";
    } else {
      removeClass(input.parentElement.parentElement, "good");

      addClass(input.parentElement.parentElement, "bad");

      input.parentElement.nextElementSibling.innerText = "Invalid Email";
    }
  };

  const identifyUnique = async (e: any) => {
    const input = e.currentTarget;

    const text = input.value.trim();

    const makeInvalid = (val: string) => {
      setEmailStatus("invalid");

      removeClass(input.parentElement.parentElement, "good");

      addClass(input.parentElement.parentElement, "bad");

      input.parentElement.nextElementSibling.innerText = val;
    };

    const makeValid = () => {
      setEmailStatus("valid");

      removeClass(input.parentElement.parentElement, "bad");

      addClass(input.parentElement.parentElement, "good");

      input.parentElement.nextElementSibling.innerText = "";
    };

    setFormEmail(input.value);

    if (isEmail(text)) {
      setEmailStatus("checking");

      const data = await getApiJson(userExistence(text));

      if (data.message === "user does not exist") {
        makeValid();
      } else {
        makeInvalid("Email is taken");
      }
    } else {
      makeInvalid("Invalid Email");
    }
  };

  const validatePass = (e: any) => {
    const input = e.currentTarget;

    const text = input.value.trim();

    setFormPass(input.value);

    if (text.length > 4) {
      removeClass(input.parentElement.parentElement, "bad");

      addClass(input.parentElement.parentElement, "good");

      input.parentElement.nextElementSibling.innerText = "";
    } else {
      removeClass(input.parentElement.parentElement, "good");

      addClass(input.parentElement.parentElement, "bad");

      input.parentElement.nextElementSibling.innerText =
        "Password is too short";
    }
  };

  const createAccount = async (e: any) => {
    e.preventDefault();

    const form = e.currentTarget;

    setFormStatus("sending");

    if (formName.trim().length < 1) {
      form["elpis-adap-name"].focus();
      return setFormStatus("filling");
    }

    if (!isEmail(formEmail.trim())) {
      form["elpis-adap-email"].focus();
      return setFormStatus("filling");
    }

    if (formPass.trim().length <= 4) {
      form["elpis-adap-pass"].focus();
      return setFormStatus("filling");
    }

    const data = await getApiJson(userExistence(formEmail.trim()));

    if (!(data.message === "user does not exist")) {
      form["elpis-adap-email"].focus();
      return setFormStatus("filling");
    }

    const userCreationData = await postApiJson(createUser(), {
      name: formName,
      email: formEmail,
      password: formPass,
    });

    if (userCreationData.error) {
      sendMiniMessage(
        {
          icon: { name: "times", style: {} },

          content: { text: "An Error Occured!", style: {} },

          style: {},
        },
        2000,
      );

      form["elpis-adap-name"].focus();
      return setFormStatus("filling");
    } else {
      dispatch(
        setUserData({
          ...userCreationData.user,
          token: userCreationData.token,
        }),
      );

      dispatch(setRefetchCart(true));

      cookie.set(tokenCookieName, userCreationData.token, {
        path: "/",
        expires: new Date(90 ** 7),
      });

      setFormStatus("sent");

      navigate("/");
    }
  };

  return (
    <SignUpStyle>
      <div className="page-container">
        <div className="intro">
          <h1>Sign up</h1>

          <p>Welcome to {siteName}, there are goods waiting for you.</p>
        </div>

        <div className="form">
          <form onSubmit={createAccount}>
            <div className="form-pack">
              <label htmlFor="elpis-adap-name">Name</label>

              <input
                required
                type="text"
                id="elpis-adap-name"
                name="elpis-adap-name"
                placeholder="Enter your name here"
                value={formName}
                onInput={validateName}
                onFocus={validateName}
                onBlur={validateName}
              />

              <small className="valid-text"></small>
            </div>

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
                  onInput={validateEmail}
                  onFocus={validateEmail}
                  onBlur={identifyUnique}
                  autoComplete="elpis-adap-email"
                />

                <div className="icon-hol">{getEmailIcon(emailStatus)}</div>
              </div>

              <small className="valid-text"></small>
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
                  onInput={validatePass}
                  onFocus={validatePass}
                  onBlur={validatePass}
                  autoComplete="elpis-adap-pass"
                />

                <div className="icon-hol">
                  {getPasswordIcon(showPassword, setShowPassword)}
                </div>
              </div>

              <small className="valid-text"></small>
            </div>

            <div className="but-pack">
              <button disabled={formStatus !== "filling"}>
                <span>Sign up</span>{" "}
                {formStatus === "sending" && (
                  <Loader color="white" secondaryColor="#ccc" size="1rem" />
                )}
              </button>
            </div>
          </form>

          <span className="al--dfoouds">
            <Link to="/login">Already a member?</Link>
          </span>
        </div>
      </div>
    </SignUpStyle>
  );
};

const SignUpStyle = styled.div`
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

const getEmailIcon = (status: string) => {
  switch (status) {
    case "unverified":
      return <></>;

    case "checking":
      return <Loader color="black" secondaryColor="#555" size="1rem" />;

    case "valid":
      return <FaCheck size="1rem" color="green" />;

    case "invalid":
      return <FaTimes size="1rem" color="red" />;

    default:
      return <></>;
  }
};

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

export default SignupPage;

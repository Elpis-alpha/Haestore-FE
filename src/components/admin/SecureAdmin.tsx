import { useState } from "react";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import styled from "styled-components";

import { verifyAdmin } from "../../api";

import { getApiJson } from "../../controllers/APICtrl";

import { sendMiniMessage } from "../../controllers/MessageCtrl";

const SecureAdmin = ({ setAllowAdmin }: { setAllowAdmin: any }) => {
  const [formPass, setFormPass] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const testPassword = async (e: any) => {
    e.preventDefault();

    const form = e.currentTarget;

    if (form.classList.contains("disabled")) return false;

    form.classList.add("disabled");

    sendMiniMessage({
      icon: { name: "loading", style: {} },

      content: { text: "Verifing Password!", style: {} },
    });

    const password = formPass;

    setFormPass("");

    const userVData = await getApiJson(verifyAdmin(password));

    if (userVData.error) {
      sendMiniMessage(
        {
          icon: { name: "times", style: {} },

          content: { text: "Wrong Password 😁!", style: {} },
        },
        2000,
      );
    } else {
      sendMiniMessage(
        {
          icon: { name: "ok", style: {} },

          content: { text: "Password Accepted!", style: {} },
        },
        2000,
      );

      setAllowAdmin(password);
    }

    form.classList.remove("disabled");
  };

  return (
    <SecureAdminStyle>
      <div className="page-container">
        <div className="intro">
          <h1>Hello Admin</h1>

          <p>Hope you haven't forgotten the password</p>
        </div>

        <div className="form">
          <form onSubmit={testPassword}>
            <div className="form-pack">
              <label htmlFor="elpis-adap-admin-pass">Password</label>

              <div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  id="elpis-adap-admin-pass"
                  name="elpis-adap-admin-pass"
                  placeholder="••••••••••"
                  value={formPass}
                  onInput={(e) => setFormPass(e.currentTarget.value)}
                  autoComplete="elpis-adap-admin-pass"
                />

                <div className="icon-hol">
                  {getPasswordIcon(showPassword, setShowPassword)}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SecureAdminStyle>
  );
};

const SecureAdminStyle = styled.div`
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
    margin: auto 0;
    text-align: center;
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
      text-align: left;
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

export default SecureAdmin;

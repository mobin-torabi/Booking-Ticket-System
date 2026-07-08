import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { loginUser } from "../../api/authApi";

import { useAuth } from "../../context/AuthContext";

import { ROUTES } from "../../utils/routes";

import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

import { showError, showPromise } from "../../utils/toast";

export default function Login() {
  const navigate = useNavigate();

  const { login, isAuthenticated, isAdmin, isCustomer } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME);
    }
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleRegister() {
    navigate(ROUTES.REGISTER);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await showPromise(loginUser(form), {
        loading: "در حال ورود...",
        success: "خوش آمدید!",
      });

      login(data.user);

      navigate(ROUTES.HOME);
    } catch (error) {
      showError(error.response?.data?.error ?? "خطا در ورود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 400,
          margin: "50px auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <h1 style={{ fontWeight: "bold" }}>ورود</h1>

        <Input
          label="نام کاربری"
          name="username"
          value={form.username}
          onChange={handleChange}
          required={true}
        />

        <Input
          label="رمز ورود"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required={true}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "در حال ورود..." : "ورود"}
        </Button>
        <Button onClick={handleRegister}>ثبت نام</Button>
      </form>
    </>
  );
}

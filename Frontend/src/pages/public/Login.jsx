import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { loginUser } from "../../api/authApi";

import { useAuth } from "../../context/AuthContext";

import { ROUTES } from "../../utils/routes";

import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

import { showError, showSuccess } from "../../utils/toast";

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

      const { data } = await loginUser(form);

      login(data.user);

      showSuccess("Welcome!");

      navigate(ROUTES.HOME);
    } catch (error) {
      showError(error.response?.data?.error ?? "Login failed");
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
        <h1>Login</h1>

        <Input
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          required={true}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required={true}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
        <Button onClick={handleRegister}>Register</Button>
      </form>
    </>
  );
}

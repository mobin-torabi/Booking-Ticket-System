import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { registerUser } from "../../api/authApi";

import { useAuth } from "../../context/AuthContext";

import { ROUTES } from "../../utils/routes";

import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";

import { showError, showSuccess } from "../../utils/toast";

export default function Register() {
  const navigate = useNavigate();

  const { isAuthenticated, isAdmin, isCustomer } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isCustomer) {
      navigate(ROUTES.DASHBOARD);
    } else if (isAuthenticated && isAdmin) {
      navigate(ROUTES.ADMIN);
    }
  });

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "",
    birthDate: "",
    email: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await registerUser(form);

      showSuccess("Registered successfully!");

      navigate(ROUTES.LOGIN);
    } catch (error) {
      showError(error.response?.data?.error ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 600,
        margin: "50px auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h1>Register</h1>

      <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
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
      </div>

      <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
        <Input
          label="First Name"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required={true}
        />

        <Input
          label="Last Name"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required={true}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
        <Input
          label="Phone Number"
          name="phoneNumber"
          type="number"
          value={form.phoneNumber}
          onChange={handleChange}
          required={true}
        />

        <Select
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          options={[
            {
              label: "Male",
              value: "male",
            },
            {
              label: "Female",
              value: "female",
            },
          ]}
          required={true}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
        <Input
          label="Birthday"
          type="date"
          name="birthDate"
          value={form.birthDate}
          onChange={handleChange}
          required={true}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </Button>
    </form>
  );
}

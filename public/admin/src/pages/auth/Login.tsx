import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
} from "@mui/material";

import { useAuth } from "@/contexts/AuthContext";
import { setToken } from "@/utils/token";
import { connect } from "@/services/websocket";
import { loginApi } from "@/api/auth";


const Login: React.FC = () => {
  const [error, setError] = useState("");
  const { login } = useAuth(); // ✅ FIXED
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },

    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string().required("Required"),
    }),

    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError("");

        const res = await loginApi(values.email, values.password);

        // ✅ store token
          localStorage.setItem("token", res.token);

        // ✅ update context (IMPORTANT FIX)
        login(res.user);

        // ✅ connect websocket
        connect();

        // ❗ navigation handled inside AuthContext
        // navigate("/"); ← optional (you can keep or remove)

      } catch (err: any) {
        setError(err?.response?.data?.message || "Login failed");
      } finally {
        setSubmitting(false);
      }
    },
  });



  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h5">Sign in</Typography>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && !!formik.errors.email}
              helperText={formik.touched.email && formik.errors.email}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && !!formik.errors.password}
              helperText={formik.touched.password && formik.errors.password}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
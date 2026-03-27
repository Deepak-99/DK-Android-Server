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

              // store token (correct way)
              setToken(res.token);
              localStorage.setItem("user", JSON.stringify(res.user)); // IMPORTANT
              login(res.user);

          } catch (err: any) {
              setError(err?.response?.data?.message || "Login failed");
          } finally {
              setSubmitting(false);
          }
      },
  });



    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#0b0f14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    backgroundColor: "#11161c",
                    border: "1px solid #1f2933",
                    padding: 4,
                    width: 400
                }}
            >
                <Typography variant="h5">Sign in</Typography>

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}

                <Box
                    component="form"
                    onSubmit={formik.handleSubmit}
                    sx={{ mt: 2 }}
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
         </Paper>
        </Box>

  );
};

export default Login;
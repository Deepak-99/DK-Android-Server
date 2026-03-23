import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from "@mui/material";

import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { label: "Dashboard", path: "/" },
    { label: "Devices", path: "/devices" },
    { label: "Logs", path: "/logs" }
  ];

  return (
    <Box
      sx={{
        width: 240,
        height: "100vh",
        borderRight: "1px solid #ddd",
        pt: 8
      }}
    >
      <List>
        {menu.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
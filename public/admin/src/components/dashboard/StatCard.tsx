import { Paper, Typography } from "@mui/material";

export default function StatCard({
                                     title,
                                     value,
                                 }: {
    title: string;
    value: string | number;
}) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
                {title}
            </Typography>
            <Typography variant="h5">{value}</Typography>
        </Paper>
    );
}

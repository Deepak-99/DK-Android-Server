export async function downloadRecording(id: number, filename: string) {
    const res = await fetch(`/calls/recording/${id}`);
    const blob = await res.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

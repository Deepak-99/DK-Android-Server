import { toast } from "sonner";

export const notifySuccess = (msg: string) =>
    toast.success(msg);

export const notifyError = (msg: string) =>
    toast.error(msg);

export const notifyInfo = (msg: string, p0: string) =>
    toast.info(msg);

export function showToast(message: string, type: "success" | "error") {
    const div = document.createElement("div");

    div.className = `
    fixed top-4 right-4 px-4 py-2 rounded-lg
    text-white z-50
    ${type === "success" ? "bg-green-600" : "bg-red-600"}
  `;

    div.innerText = message;

    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 3000);
}
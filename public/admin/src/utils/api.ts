export function unwrap(res: any) {
    if (!res) return null;

    if (res.data?.data) return res.data.data;
    if (res.data) return res.data;

    return res;
}
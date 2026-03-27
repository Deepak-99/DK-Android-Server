import { useAuthStore } from "@/store/authStore";

export function usePermissions(){

    const user = useAuthStore(s=>s.user);

    const hasRole = (role:string)=>{
        return user?.role === role;
    };

    const isAdmin = ()=> user?.role==="admin";

    return { hasRole,isAdmin };
}
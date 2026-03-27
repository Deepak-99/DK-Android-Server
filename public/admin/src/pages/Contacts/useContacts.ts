import { useEffect,useState } from "react";
import { contactsApi } from "@/services/contactsApi";

export function useContacts(deviceId:string){

  const [contacts,setContacts] = useState([]);

  useEffect(()=>{
    contactsApi.list(deviceId).then(setContacts);
  },[deviceId]);

  return { contacts };
}
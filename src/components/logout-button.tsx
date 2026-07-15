"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function LogoutButton() { const router = useRouter(); const [pending,setPending]=useState(false); return <button className="text-button" disabled={pending} onClick={async()=>{setPending(true); await fetch('/api/auth/logout',{method:'POST'}).catch(()=>undefined); router.replace('/login'); router.refresh();}}>{pending?'Signing out…':'Log out'}</button>; }

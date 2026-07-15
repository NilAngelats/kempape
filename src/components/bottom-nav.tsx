"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS } from "@/lib/navigation";
export function BottomNav(){const pathname=usePathname();return <nav className="nav" aria-label="Primary navigation">{PRIMARY_NAV_ITEMS.map(item=><Link href={item.href} aria-current={pathname===item.href?'page':undefined} key={item.href}><span aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>)}</nav>}

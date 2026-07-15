import Image from "next/image";
import{getAsset,type AssetCategory}from"@/lib/assets/registry";
export function ItemArt({category,imageKey,name,size=220}:{category:Extract<AssetCategory,"equipment"|"consumables"|"chaosCards">;imageKey:string;name:string;size?:number}){const asset=getAsset(category,imageKey);return asset?<Image src={asset.path} alt={name} width={size} height={size} style={{width:"100%",height:"auto",objectFit:"contain"}}/>:null}

import manifestData from "@/../public/assets/manifest.json";
import { z } from "zod";

const assetSchema = z.object({ displayName:z.string().min(1), path:z.string().regex(/^\/assets\//), mime:z.enum(["image/png","image/gif"]), width:z.number().int().positive(), height:z.number().int().positive(), assignable:z.boolean().optional() });
const manifestSchema = z.object({ version:z.literal(1), characters:z.record(z.string(),assetSchema), faces:z.record(z.string(),assetSchema), ui:z.record(z.string(),assetSchema), actions:z.record(z.string(),assetSchema), templates:z.record(z.string(),assetSchema), equipment:z.record(z.string(),assetSchema), consumables:z.record(z.string(),assetSchema), chaosCards:z.record(z.string(),assetSchema), unresolved:z.array(z.string()) });
export const assetManifest = manifestSchema.parse(manifestData);
export type AssetCategory = "characters"|"faces"|"ui"|"actions"|"templates"|"equipment"|"consumables"|"chaosCards";
export function getAsset(category:AssetCategory,key:string){return assetManifest[category][key]??null}
export function validateAssetRegistry(existingPaths?:ReadonlySet<string>){const errors:string[]=[];for(const category of ["characters","faces","ui","actions","templates","equipment","consumables","chaosCards"] as const){const keys=new Set<string>();for(const [key,asset] of Object.entries(assetManifest[category])){if(keys.has(key))errors.push(`Duplicate ${category} key: ${key}`);keys.add(key);if(existingPaths&&!existingPaths.has(asset.path))errors.push(`Missing asset: ${asset.path}`);if(category==="characters"&&asset.assignable===false)errors.push(`Character ${key} cannot be unassignable`);}}return errors;}

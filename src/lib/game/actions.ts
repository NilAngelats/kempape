export type ActionTier = "common" | "rare" | "epic" | "legendary";
export type ActionCategory = "hp_cost" | "physical_recovery" | "social" | "festival_special";
export type DistinctReference = "person" | "group" | "item" | null;
export type GameActionDefinition = Readonly<{id:string;name:string;shortDescription:string;category:ActionCategory;tier:ActionTier;xpPercentage:number;coinReward:number;hpCost:number;cooldownMinutes:number|null;dailyCap:number|null;festivalCap:number|null;requiresDistinctReference:DistinctReference;isEnabled:boolean;isExtremeChallenge:boolean;imageKey:string;hourglassResettable:boolean}>;
const action=(v:GameActionDefinition)=>v;
const hp=(id:string,name:string,description:string,tier:ActionTier,xpPercentage:number,coinReward:number,hpCost:number,imageKey=id)=>action({id,name,shortDescription:description,category:"hp_cost",tier,xpPercentage,coinReward,hpCost,cooldownMinutes:10,dailyCap:null,festivalCap:null,requiresDistinctReference:null,isEnabled:true,isExtremeChallenge:false,imageKey,hourglassResettable:true});
const standard=(id:string,name:string,shortDescription:string,category:ActionCategory,tier:ActionTier,xpPercentage:number,coinReward:number,imageKey:string,cooldownMinutes:number|null=null,dailyCap:number|null=null,festivalCap:number|null=null,requiresDistinctReference:DistinctReference=null)=>action({id,name,shortDescription,category,tier,xpPercentage,coinReward,hpCost:0,cooldownMinutes,dailyCap,festivalCap,requiresDistinctReference,isEnabled:true,isExtremeChallenge:false,imageKey,hourglassResettable:cooldownMinutes!==null});
export const ACTIONS = [
 hp("smoke_cigarette","Smoke a Cigarette","Smoke a cigarette or an approved substitute.","common",.15,10,6),
 hp("drink_beer","Drink a Beer","Drink a beer or an approved non-alcoholic substitute.","common",.15,10,10),
 hp("drink_strong_mixed_drink","Drink a Strong Mixed Drink","Drink a strong mixed drink or approved substitute.","rare",.35,25,14),
 hp("take_shot","Take a Shot","Take a shot or approved substitute.","rare",.35,25,18),
 hp("take_jagermeister_shot","Take a Jägermeister Shot","Take a Jägermeister shot or approved substitute.","epic",.60,50,24),
 hp("smoke_joint","Smoke a Joint","Smoke a joint or approved substitute.","epic",.60,50,30),
 hp("finish_your_drink","Finish Your Drink","Finish your drink or approved substitute.","legendary",.90,100,37),
 action({id:"extreme_challenge",name:"Extreme Challenge",shortDescription:"Unavailable until an administrator configures the challenge.",category:"festival_special",tier:"legendary",xpPercentage:1.5,coinReward:150,hpCost:60,cooldownMinutes:null,dailyCap:1,festivalCap:null,requiresDistinctReference:null,isEnabled:false,isExtremeChallenge:true,imageKey:"extreme_challenge",hourglassResettable:false}),
 standard("push_ups_20","20 Push-ups","Complete 20 push-ups.","physical_recovery","common",.15,10,"push_ups_20",60,5),
 standard("squats_40","40 Squats","Complete 40 squats.","physical_recovery","common",.15,10,"squats_40",60,5),
 standard("cold_shower","Cold Shower","Take a cold shower.","physical_recovery","common",.15,10,"cold_shower",240,2),
 standard("pay_for_shower","Pay for a Shower","Pay for and take a shower.","physical_recovery","rare",.35,25,"pay_for_shower",null,1),
 standard("find_someone_you_know","Find Someone You Know","Find a different person you already know.","social","common",.15,10,"find_someone_you_know",null,null,null,"person"),
 standard("talk_to_stranger_20_minutes","Talk to a Stranger for 20+ Minutes","Talk to a stranger for at least 20 minutes.","social","rare",.35,25,"talk_to_stranger_20_minutes",null,2,null,"person"),
 standard("find_catalan_people","Find Catalan People","Meet Catalan people; no identifying details are stored.","social","rare",.35,25,"find_catalan_people",null,1,null,"group"),
 standard("make_out_with_someone","Make Out With Someone","Voluntary and consensual; no proof or private details are stored.","social","epic",.60,50,"make_out_with_someone",null,1,null,"person"),
 standard("have_sex_with_someone","Have Sex With Someone","Voluntary and consensual; no proof or private details are stored.","social","legendary",.90,100,"have_sex_with_someone",null,null,1,"person"),
 standard("get_permanent_tattoo","Get a Permanent Tattoo","Get a permanent tattoo.","social","legendary",.90,100,"get_permanent_tattoo",null,null,1),
 standard("take_group_photo_other_festival_group","Take a Group Photo With Another Festival Group","Take a group photo with another festival group.","festival_special","rare",.35,25,"action_fallback",null,1,null,"group"),
 standard("learn_and_test_phrase_other_language","Learn and Test a Phrase in Another Language","Learn a phrase and test it on someone else.","festival_special","rare",.35,25,"action_fallback",null,1,null,"person"),
 standard("lead_toast_other_festival_group","Lead a Toast With Another Festival Group","Lead a toast with another festival group.","festival_special","rare",.35,25,"action_fallback",null,1,null,"group"),
 standard("receive_item_from_another_person","Receive an Item From Another Person","Convince someone to freely give or lend you an item.","festival_special","epic",.60,50,"action_fallback",null,1,null,"item"),
] as const;
export type ActionId = typeof ACTIONS[number]["id"];
export const ACTION_BY_ID = new Map(ACTIONS.map(v=>[v.id,v]));

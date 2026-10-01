window.realexSupabase=null;
window.supabaseReady=false;

(function(){
  const url=window.REALEX_SUPABASE_URL;
  const key=window.REALEX_SUPABASE_PUBLISHABLE_KEY;
  if(window.supabase&&url&&key&&!url.includes("PASTE_")&&!key.includes("PASTE_")){
    window.realexSupabase=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    window.supabaseReady=true;
  }
})();

async function saveOrderToSupabase(order){
  if(!window.supabaseReady)return {saved:false};
  const orderId=crypto.randomUUID();

  const {error}=await realexSupabase.from("orders").insert({
    id:orderId,
    customer_name:order.name,
    phone:order.phone,
    address:order.address,
    fulfillment_method:order.method,
    delivery_location:order.delivery_location||null,
    delivery_fee:Number(order.delivery_fee||0),
    subtotal:Number(order.subtotal||0),
    total:Number(order.total||0),
    grand_total:Number(order.grand_total||order.total||0),
    note:order.note||null,
    status:"pending",
    source:"web"
  });
  if(error)throw error;

  const items=(order.items||[]).map(item=>({
    order_id:orderId,
    product_id:item.id,
    product_name:item.name,
    unit_price:Number(item.price),
    quantity:Number(item.qty),
    line_total:Number(item.price)*Number(item.qty)
  }));
  if(items.length){
    const {error:itemError}=await realexSupabase.from("order_items").insert(items);
    if(itemError)throw itemError;
  }
  return {saved:true,id:orderId};
}

async function loadProductsFromSupabase(){
  if(!window.supabaseReady)return [];
  const {data,error}=await realexSupabase.from("products")
    .select("id,name,price,category,description,image_url,available")
    .eq("available",true).order("name");
  if(error)throw error;
  return data||[];
}

async function loadBranchesFromSupabase(){
  if(!window.supabaseReady)return [];
  const {data,error}=await realexSupabase.from("branches")
    .select("id,name,type,address,city,active,sort_order")
    .eq("active",true).order("sort_order",{ascending:true});
  if(error)throw error;
  return data||[];
}

async function saveInquiryToSupabase(payload){
  if(!window.supabaseReady)return {saved:false};
  const {error}=await realexSupabase.from("food_inquiries").insert(payload);
  if(error)throw error;
  return {saved:true};
}

async function saveCateringToSupabase(payload){
  if(!window.supabaseReady)return {saved:false};
  const {error}=await realexSupabase.from("catering_requests").insert(payload);
  if(error)throw error;
  return {saved:true};
}

async function loadActiveAdsFromSupabase(){
  if(!window.supabaseReady)return [];
  const {data,error}=await realexSupabase.from("advertisements").select("id,title,body,image_url,button_text,button_link,active").eq("active",true).order("created_at",{ascending:false});
  if(error)throw error;
  return data||[];
}

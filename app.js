let PRODUCTS=[
{id:1,name:"Jollof Rice & Barbecue Chicken",price:3200,cat:"Rice",img:"./images/jollof-bbq-chicken.png"},
{id:2,name:"Milk Popcorn",price:500,cat:"Snacks",img:"./images/milk-popcorn.png"},
{id:3,name:"Stir-Fried Spaghetti & Barbecue Chicken",price:3200,cat:"Rice",img:"./images/stir-fried-spaghetti-bbq-chicken.png"},
{id:4,name:"Grilled Fish & Fries",price:15000,cat:"Grills",img:"./images/grilled-fish-fries.png"},
{id:5,name:"Grilled Chicken & Fries",price:6000,cat:"Grills",img:"./images/grilled-chicken-fries.png"},
{id:6,name:"Grilled Turkey & Fries",price:8000,cat:"Grills",img:"./images/grilled-turkey-fries.png"},
{id:7,name:"Small Chops & Barbecue Grilled Chicken",price:2500,cat:"Small Chops",img:"./images/small-chops-bbq-chicken.png"},
{id:8,name:"Ewa Agoyin & Plantain",price:2000,cat:"Rice",img:"./images/ewa-agoyin-plantain.png"},
{id:9,name:"Ewa Agoyin",price:1000,cat:"Rice",img:"./images/ewa-agoyin.png"},
{id:10,name:"White Rice + Sauce + Meat/Egg",price:1200,cat:"Rice",img:"./images/white-rice-protein.png"},
{id:11,name:"White Rice + Sauce + Chicken",price:2500,cat:"Rice",img:"./images/white-rice-chicken.png"},
{id:12,name:"Samosa & Spring Roll — 12 pieces",price:2000,cat:"Small Chops",img:"./images/samosa-spring-roll.png"},
{id:13,name:"Small Chops — serves 10 people",price:18000,cat:"Small Chops",img:"./images/small-chops-10-people.png"}
];
const FALLBACK_PRODUCTS=[...PRODUCTS];
const WHATSAPP="2348180029999";
const DELIVERY_FEES={Apete:2000,Bariga:2500,Ikeja:3000};
let cart=JSON.parse(localStorage.getItem("realex_cart")||"[]"),activeCat="All";

const fmt=n=>"₦"+Number(n||0).toLocaleString("en-NG");
function toast(msg){const t=document.getElementById("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2200)}

function renderProducts(){
  const grid=document.getElementById("productGrid");if(!grid)return;
  const q=(document.getElementById("searchInput")?.value||"").toLowerCase();
  const list=PRODUCTS.filter(p=>(activeCat==="All"||p.cat===activeCat)&&p.name.toLowerCase().includes(q));
  grid.innerHTML=list.map(p=>`<article class="product"><img src="${p.img||'./images/realex-logo.png'}" alt="${p.name}" onerror="this.style.opacity='.25'"><div class="product-body"><h3>${p.name}</h3><div class="price">${fmt(p.price)}</div><div class="product-meta"><small>${p.cat||"Menu"}</small><button class="add" onclick="addToCart(${p.id})">Add +</button></div></div></article>`).join("")||"<p>No matching food found. Try a custom inquiry.</p>";
}
function renderCats(){const cats=["All",...new Set(PRODUCTS.map(p=>p.cat).filter(Boolean))];document.getElementById("chips").innerHTML=cats.map(c=>`<button class="chip ${c===activeCat?"active":""}" onclick="setCat('${c.replaceAll("'","\\'")}')">${c}</button>`).join("")}
function setCat(c){activeCat=c;renderCats();renderProducts()}
function addToCart(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const found=cart.find(x=>x.id===id);found?found.qty++:cart.push({...p,qty:1});saveCart();toast(`${p.name} added to cart`)}
function saveCart(){localStorage.setItem("realex_cart",JSON.stringify(cart));updateCount()}
function updateCount(){const n=cart.reduce((s,x)=>s+x.qty,0);document.getElementById("cartCount").textContent=n;document.getElementById("bottomCount").textContent=n}
function openDrawer(){document.getElementById("cartDrawer").classList.add("show");renderCart()}
function closeDrawer(){document.getElementById("cartDrawer").classList.remove("show")}
function renderCart(){const box=document.getElementById("cartItems");if(!box)return;if(!cart.length){box.innerHTML="<p style='color:#9e968c;padding:20px 0'>Your cart is empty.</p>";document.getElementById("cartTotal").textContent="₦0";return}box.innerHTML=cart.map(x=>`<div class="cart-row"><img src="${x.img||'./images/realex-logo.png'}" alt=""><div><b>${x.name}</b><div>${fmt(x.price)} × ${x.qty}</div></div><div class="qty"><button onclick="changeQty(${x.id},-1)">−</button> ${x.qty} <button onclick="changeQty(${x.id},1)">+</button></div></div>`).join("");document.getElementById("cartTotal").textContent=fmt(getFoodSubtotal())}
function changeQty(id,d){const x=cart.find(a=>a.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(a=>a.id!==id);saveCart();renderCart()}
function openModal(id){document.getElementById(id)?.classList.add("show")}
function closeModal(id){document.getElementById(id)?.classList.remove("show")}
function getFoodSubtotal(){return cart.reduce((s,x)=>s+x.price*x.qty,0)}
function getDeliveryFee(){const method=document.getElementById("fulfillmentMethod")?.value,loc=document.getElementById("deliveryLocation")?.value;return method==="Delivery"?(DELIVERY_FEES[loc]||0):0}
function updateCheckoutTotal(){const sub=getFoodSubtotal(),fee=getDeliveryFee();document.getElementById("checkoutSubtotal").textContent=fmt(sub);document.getElementById("checkoutDeliveryFee").textContent=fmt(fee);document.getElementById("checkoutGrandTotal").textContent=fmt(sub+fee)}
function toggleDeliveryFields(){const method=document.getElementById("fulfillmentMethod").value,fields=document.getElementById("deliveryFields"),loc=document.getElementById("deliveryLocation"),addr=document.getElementById("deliveryAddress"),isDelivery=method==="Delivery";fields.style.display=isDelivery?"grid":"none";loc.required=isDelivery;addr.required=isDelivery;updateCheckoutTotal()}
function openCheckout(){if(!cart.length){toast("Your cart is empty");return}closeDrawer();openModal("checkoutModal");document.getElementById("fulfillmentMethod").value="Delivery";toggleDeliveryFields();updateCheckoutTotal()}
function scrollToSection(id){document.getElementById(id)?.scrollIntoView({behavior:"smooth"});document.getElementById("mobileMenu")?.classList.remove("show");document.getElementById("menuBtn")?.setAttribute("aria-expanded","false")}
function isOpen(){const now=new Date(),day=now.getDay(),h=now.getHours()+now.getMinutes()/60,open=day===0?13:10,close=day===0?22:21,status=document.getElementById("openStatus");if(!status)return;if(h>=open&&h<close){status.textContent="● Open now";status.style.color="#83df9a"}else status.textContent=day===0?"Closed • Opens Sunday at 1 PM":"Closed • Opens at 10 AM"}
function wa(message){window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,"_blank")}
function gallery(){const items=[["gallery-grilling-meat.png","Outdoor grilling"],["gallery-foil-grilling.png","Street food grilling"],["gallery-fritters.png","Fresh fritters"],["gallery-beach-bbq.png","BBQ catering"],["gallery-jollof-buffet.png","Jollof buffet service"],["gallery-catering-buffet.png","Catering buffet"],["gallery-chicken-grill.png","Chicken grill"],["gallery-event-video.mp4","Realex Cosset event video"]];document.getElementById("galleryGrid").innerHTML=items.map(x=>x[0].endsWith(".mp4")?`<article class="gallery-card video-card"><video controls preload="metadata"><source src="./images/${x[0]}" type="video/mp4"></video><div class="caption">${x[1]}</div></article>`:`<article class="gallery-card"><img src="./images/${x[0]}" alt="${x[1]}" loading="lazy"><div class="caption">${x[1]}</div></article>`).join("")}

async function loadLiveMenu(){
  if(!window.supabaseReady)return;
  try{
    const rows=await loadProductsFromSupabase();
    if(rows.length){
      const localImages={
"Jollof Rice & Barbecue Chicken":"./images/jollof-bbq-chicken.png",
"Milk Popcorn":"./images/milk-popcorn.png",
"Stir-Fried Spaghetti & Barbecue Chicken":"./images/stir-fried-spaghetti-bbq-chicken.png",
"Grilled Fish & Fries":"./images/grilled-fish-fries.png",
"Grilled Chicken & Fries":"./images/grilled-chicken-fries.png",
"Grilled Turkey & Fries":"./images/grilled-turkey-fries.png",
"Small Chops & Barbecue Grilled Chicken":"./images/small-chops-bbq-chicken.png",
"Ewa Agoyin & Plantain":"./images/ewa-agoyin-plantain.png",
"Ewa Agoyin":"./images/ewa-agoyin.png",
"White Rice + Sauce + Meat/Egg":"./images/white-rice-protein.png",
"White Rice + Sauce + Chicken":"./images/white-rice-chicken.png",
"Samosa & Spring Roll — 12 pieces":"./images/samosa-spring-roll.png",
"Small Chops — serves 10 people":"./images/small-chops-10-people.png"
};
PRODUCTS=rows.map(p=>({id:p.id,name:p.name,price:Number(p.price),cat:p.category||"Menu",img:p.image_url||localImages[p.name]||"./images/realex-logo.png"}));
      const ids=new Set(PRODUCTS.map(p=>String(p.id)));
      cart=cart.filter(x=>ids.has(String(x.id)));
      saveCart();
      activeCat="All";renderCats();renderProducts();renderCart();
    }
  }catch(err){console.warn("Live menu unavailable; using fallback menu.",err)}
}

async function loadLiveAds(){
  const box=document.getElementById("liveAdvert");if(!box||!window.supabaseReady)return;
  try{
    const ads=await loadActiveAdsFromSupabase();
    if(!ads.length){box.innerHTML="";return}
    const localAdvertImage="./images/ready-to-fry-ad.png";
    box.innerHTML=ads.map(a=>{const image=a.image_url||localAdvertImage;return `<article class="live-ad has-image"><img src="${image}" alt="${a.title||'Advertisement'}" loading="lazy"><div class="live-ad-copy"><span class="eyebrow">LIVE OFFER</span><h2>${a.title||''}</h2><p>${a.body||''}</p>${a.button_link?`<a class="primary" href="${a.button_link}" target="_blank" rel="noopener">${a.button_text||'Order Now'}</a>`:''}</div></article>`}).join("");
  }catch(err){console.warn("Live advertisements unavailable.",err)}
}

async function loadLiveLocations(){
  const grid=document.querySelector(".location-grid"),map=document.querySelector(".map-panel iframe");if(!grid)return;
  if(!window.supabaseReady)return;
  try{
    const branches=await loadBranchesFromSupabase();if(!branches.length)return;
    grid.innerHTML=branches.map(b=>`<article><span class="tag">${String(b.type||"BRANCH").toUpperCase()} • ${String(b.city||"").toUpperCase()}</span><h3>${b.name}</h3><p>${b.address}</p><a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">Get Directions →</a></article>`).join("");
    if(map)map.src="https://www.google.com/maps?q="+encodeURIComponent(branches[0].address)+"&output=embed";
  }catch(err){console.warn("Live locations unavailable; using fallback locations.",err)}
}

document.getElementById("cartBtn").onclick=openDrawer;document.getElementById("bottomCart").onclick=openDrawer;
document.getElementById("menuBtn").onclick=()=>{const m=document.getElementById("mobileMenu"),show=!m.classList.contains("show");m.classList.toggle("show",show);document.getElementById("menuBtn").setAttribute("aria-expanded",show)};
document.getElementById("searchBtn").onclick=()=>{scrollToSection("menu");document.getElementById("searchWrap").classList.add("show");document.getElementById("searchInput").focus()};document.getElementById("openSearch").onclick=()=>{document.getElementById("searchWrap").classList.toggle("show");document.getElementById("searchInput").focus()};document.getElementById("searchInput").oninput=renderProducts;
document.getElementById("inquiryForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),payload={food_requested:f.get("item"),quantity:f.get("quantity")||null,requested_date:f.get("date")||null,details:f.get("note")||null};try{await saveInquiryToSupabase(payload)}catch(err){console.warn(err)}wa(`Hello Realex Cosset Services, I would like to make a food inquiry.\n\nFood: ${payload.food_requested}\nQuantity: ${payload.quantity||"Not specified"}\nDate: ${payload.requested_date||"Not specified"}\nDetails: ${payload.details||"None"}`);e.target.reset()};
document.getElementById("cateringForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),payload={customer_name:f.get("name"),phone:f.get("phone"),event_type:f.get("event"),event_date:f.get("date"),guests:Number(f.get("guests"))||null,location:f.get("location")||null,request:f.get("request")||null,status:"new"};try{await saveCateringToSupabase(payload)}catch(err){console.warn(err)}wa(`Hello Realex Cosset Services, I would like to book catering.\n\nName: ${payload.customer_name}\nPhone: ${payload.phone}\nEvent: ${payload.event_type}\nDate: ${payload.event_date}\nGuests: ${payload.guests||"Not specified"}\nLocation: ${payload.location||"Not specified"}\nRequest: ${payload.request||"None"}`);closeModal("cateringModal");e.target.reset()};
document.getElementById("fulfillmentMethod").addEventListener("change",toggleDeliveryFields);document.getElementById("deliveryLocation").addEventListener("change",updateCheckoutTotal);
document.getElementById("checkoutForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target),subtotal=getFoodSubtotal(),deliveryFee=getDeliveryFee(),method=f.get("method"),location=method==="Delivery"?f.get("deliveryLocation"):"Pickup",address=method==="Delivery"?f.get("address"):"Pickup";
  if(method==="Delivery"&&!location){toast("Please select a delivery location");return}
  const total=subtotal+deliveryFee,order={name:f.get("name"),phone:f.get("phone"),address,method,delivery_location:location,delivery_fee:deliveryFee,subtotal,total,grand_total:total,note:f.get("note")||"",items:cart};
  let saved=false;
  try{saved=(await saveOrderToSupabase(order)).saved}catch(err){console.error(err);alert("The order could not be saved to the Realex system.\n\n"+(err.message||err)+"\n\nYour cart has been kept. Please try again.");return}
  const items=cart.map(x=>`${x.name} x${x.qty} — ${fmt(x.price*x.qty)}`).join("\n");
  wa(`Hello Realex Cosset Services, I would like to place an order.\n\nCustomer: ${order.name}\nPhone: ${order.phone}\nMethod: ${order.method}\nDelivery location: ${order.delivery_location}\nAddress: ${order.address}\n\n${items}\n\nFood subtotal: ${fmt(subtotal)}\nDelivery fee: ${fmt(deliveryFee)}\nTOTAL: ${fmt(total)}\nNote: ${order.note||"None"}${saved?"\n\nOrder saved to Realex system.":""}`);
  cart=[];saveCart();closeModal("checkoutModal");
};
document.querySelectorAll(".mobile-menu a").forEach(a=>a.addEventListener("click",()=>{document.getElementById("mobileMenu").classList.remove("show");document.getElementById("menuBtn").setAttribute("aria-expanded","false")}));
renderCats();renderProducts();updateCount();isOpen();gallery();setInterval(isOpen,60000);if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});loadLiveMenu();loadLiveLocations();loadLiveAds();

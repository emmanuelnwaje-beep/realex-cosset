/* Realex Cosset Services — live Supabase admin dashboard */
(function(){
  const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
  const STATUS=[['pending','Pending'],['confirmed','Confirmed'],['preparing','Preparing'],['ready','Ready'],['delivered','Delivered'],['completed','Completed'],['cancelled','Cancelled']];
  let db=null,orders=[],orderItems=[],products=[],catering=[],inquiries=[],customers=[],branches=[],ads=[];
  const money=n=>'₦'+Number(n||0).toLocaleString('en-NG');
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const norm=v=>String(v||'').trim().toLowerCase();
  function toast(message){const t=$('#toast');if(!t)return;t.textContent=message;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2400)}
  function wa(phone){let p=String(phone||'').replace(/\D/g,'');if(p.startsWith('0'))p='234'+p.slice(1);if(p)window.open('https://wa.me/'+p,'_blank','noopener')}

  const pages={dashboard:['Dashboard',"Welcome back. Here's what's happening today."],orders:['Orders','Track and update customer orders.'],menu:['Menu','Manage your food catalogue and availability.'],customers:['Customers','Customer information and order history.'],catering:['Catering Requests','Manage events and catering enquiries.'],inquiries:['Food Inquiries','Custom food requests outside the regular menu.'],locations:['Locations','Business branches and directions.'],reports:['Reports','Live business performance from Supabase.'],settings:['Settings','Manage business information.'],ads:['Advertisements','Create and manage live customer promotions.']};
  function go(id){$$('.page').forEach(x=>x.classList.remove('on'));$('#'+id)?.classList.add('on');$$('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));if(pages[id]){$('#title').textContent=pages[id][0];$('#sub').textContent=pages[id][1]}$('#side')?.classList.remove('open');if(id==='orders')renderOrders();if(id==='menu')renderMenu();if(id==='customers')renderCustomers();if(id==='catering')renderCatering();if(id==='inquiries')renderInquiries();if(id==='reports')renderReports();if(id==='locations')renderBranches();if(id==='ads')renderAds()}

  function bindNav(){
    $$('nav button').forEach(b=>b.onclick=()=>go(b.dataset.page));
    $('#logoutBtn')?.addEventListener('click', async () => {
  await signOut();
});
    $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
    $('#hamb')?.addEventListener('click',()=>$('#side')?.classList.toggle('open'));
    $('#refresh')?.addEventListener('click',async()=>{const b=$('#refresh');b.disabled=true;await loadData();b.disabled=false;toast('Dashboard refreshed')});
    $('#search')?.addEventListener('input',renderOrders);$('#filter')?.addEventListener('change',renderOrders);
    $('#customerSearch')?.addEventListener('input',renderCustomers);$('#menuSearch')?.addEventListener('input',renderMenu);$('#menuCategory')?.addEventListener('change',renderMenu);
    $('#csv')?.addEventListener('click',exportCSV);$('#addFood')?.addEventListener('click',()=>openFoodModal());
    $('#closeFoodModal')?.addEventListener('click',closeFoodModal);$('#cancelFood')?.addEventListener('click',closeFoodModal);$('#foodForm')?.addEventListener('submit',saveFood);
    $('#foodImageFile')?.addEventListener('change',previewSelectedImage);$('#foodImageUrl')?.addEventListener('input',previewUrl);$('#saveSettings')?.addEventListener('click',saveSettings);$('#addBranch')?.addEventListener('click',()=>openBranchModal());$('#closeBranchModal')?.addEventListener('click',closeBranchModal);$('#cancelBranch')?.addEventListener('click',closeBranchModal);$('#branchForm')?.addEventListener('submit',saveBranch);$('#branchModal')?.addEventListener('click',e=>{if(e.target.id==='branchModal')closeBranchModal()});
    $('#foodModal')?.addEventListener('click',e=>{if(e.target.id==='foodModal')closeFoodModal()});
    $('#addAd')?.addEventListener('click',()=>openAdModal());$('#closeAdModal')?.addEventListener('click',closeAdModal);$('#cancelAd')?.addEventListener('click',closeAdModal);$('#adForm')?.addEventListener('submit',saveAd);$('#adImageFile')?.addEventListener('change',previewAdImage);$('#adImageUrl')?.addEventListener('input',previewAdUrl);$('#adModal')?.addEventListener('click',e=>{if(e.target.id==='adModal')closeAdModal()});
  }

  async function connectAdmin(){
    if(!window.supabase||!window.REALEX_SUPABASE_URL||!window.REALEX_SUPABASE_PUBLISHABLE_KEY)throw new Error('Supabase configuration is missing.');
    db=window.supabase.createClient(window.REALEX_SUPABASE_URL,window.REALEX_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}}=await db.auth.getSession();if(!session)throw new Error('Please sign in with the Realex Cosset administrator account.');
    const {data:userData,error:userError}=await db.auth.getUser();if(userError)throw userError;
    const {data:admin,error:adminError}=await db.from('admin_users').select('user_id,name,role,active').eq('user_id',userData.user.id).eq('active',true).maybeSingle();
    if(adminError)throw adminError;if(!admin){await db.auth.signOut();throw new Error('This account is not registered as a Realex administrator.');}
    $('#adminAvatar').textContent=(admin.name||userData.user.email||'A').charAt(0).toUpperCase();
  }

  async function loadData(){
    if(!db)return;
    const results=await Promise.all([
      db.from('orders').select('*').order('created_at',{ascending:false}),
      db.from('order_items').select('*'),
      db.from('products').select('*').order('name'),
      db.from('catering_requests').select('*').order('created_at',{ascending:false}),
      db.from('food_inquiries').select('*').order('created_at',{ascending:false}),
      db.from('branches').select('*').order('sort_order',{ascending:true}),
      db.from('advertisements').select('*').order('created_at',{ascending:false})
    ]);
    const names=['orders','order_items','products','catering_requests','food_inquiries','branches'];
    for(let i=0;i<6;i++)if(results[i].error)throw new Error(names[i]+': '+results[i].error.message);
    orders=results[0].data||[];orderItems=results[1].data||[];products=results[2].data||[];catering=results[3].data||[];inquiries=results[4].data||[];branches=results[5].data||[];
    ads=results[6].error?(ads||[]):(results[6].data||[]);
    renderAll();
  }

  function renderAll(){updateDashboard();renderRecent();renderOrders();renderMenu();renderCustomers();renderCatering();renderInquiries();renderReports();renderBranches();renderAds();updateBadges()}
  function itemsFor(id){return orderItems.filter(x=>x.order_id===id)}

  function updateDashboard(){
    const today=new Date().toLocaleDateString('en-CA');const todays=orders.filter(o=>String(o.created_at||'').slice(0,10)===today&&norm(o.status)!=='cancelled');
    const sales=todays.reduce((s,o)=>s+Number(o.grand_total??o.total??0),0);const active=orders.filter(o=>['pending','confirmed','preparing','ready'].includes(norm(o.status))).length;
    $('#statSales').textContent=money(sales);$('#statSalesNote').textContent=`${todays.length} order(s) today`;$('#statOrders').textContent=orders.length;$('#statOrdersNote').textContent=`${active} active`;buildCustomers();$('#statCustomers').textContent=customers.length;$('#statCatering').textContent=catering.length;$('#statCateringNote').textContent=`${catering.filter(x=>['new','contacted'].includes(norm(x.status))).length} need attention`;
  }
  function renderRecent(){const box=$('#recent');if(!box)return;if(!orders.length){box.innerHTML='<p class="empty">No real orders yet.</p>';return}box.innerHTML=orders.slice(0,6).map(o=>`<div class="row"><div><b>#${esc(String(o.id).slice(0,8).toUpperCase())} · ${esc(o.customer_name||'Customer')}</b><small>${esc(new Date(o.created_at).toLocaleString('en-NG'))}</small></div><div><b>${money(o.grand_total??o.total)}</b><small>${esc(norm(o.status)||'pending')}</small></div></div>`).join('')}

  async function updateOrderStatus(id,status){
    status=norm(status);if(!STATUS.some(x=>x[0]===status))return toast('Invalid order status');
    const {error}=await db.from('orders').update({status}).eq('id',id);if(error)return toast(error.message);
    const o=orders.find(x=>x.id===id);if(o)o.status=status;renderAll();toast('Order status updated');
  }
  function renderOrders(){
    const body=$('#ordersBody');if(!body)return;const q=($('#search')?.value||'').toLowerCase().trim(),f=norm($('#filter')?.value||'All');
    const list=orders.filter(o=>{const hay=JSON.stringify(o).toLowerCase();return (!q||hay.includes(q))&&(f==='all'||norm(o.status)===f)});
    if(!list.length){body.innerHTML='<tr><td colspan="7" class="empty">No matching orders.</td></tr>';return}
    body.innerHTML=list.map(o=>{const items=itemsFor(o.id);const label=items.length?items.map(x=>`${esc(x.product_name)} ×${esc(x.quantity)}`).join('<br>'):'No items';const del=norm(o.fulfillment_method)==='delivery'?(o.delivery_location||'Delivery'):'Pickup';const current=norm(o.status)||'pending';return `<tr><td><b>#${esc(String(o.id).slice(0,8).toUpperCase())}</b><br><small>${esc(new Date(o.created_at).toLocaleString('en-NG'))}</small></td><td><b>${esc(o.customer_name||'—')}</b><br><small>${esc(o.phone||'')}</small></td><td>${label}</td><td><b>${money(o.grand_total??o.total)}</b><br><small>Subtotal ${money(o.subtotal)} · Delivery ${money(o.delivery_fee)}</small></td><td>${esc(del)}<br><small>${esc(o.address||'')}</small></td><td><select data-status-id="${esc(o.id)}">${STATUS.map(([v,l])=>`<option value="${v}" ${v===current?'selected':''}>${l}</option>`).join('')}</select></td><td><button class="danger small-action" onclick="deleteOrder('${esc(o.id)}')">Delete</button></td></tr>`}).join('');
    body.querySelectorAll('[data-status-id]').forEach(s=>s.onchange=()=>updateOrderStatus(s.dataset.statusId,s.value));
  }


  window.deleteOrder=async id=>{const o=orders.find(x=>String(x.id)===String(id));if(!o)return;if(!confirm(`Delete order from ${o.customer_name||'this customer'}? This cannot be undone.`))return;const {error}=await db.from('orders').delete().eq('id',id);if(error)return toast(error.message);await loadData();toast('Order deleted')}
  window.deleteCancelledOrders=async()=>{const ids=orders.filter(o=>norm(o.status)==='cancelled').map(o=>o.id);if(!ids.length)return toast('No cancelled orders to delete');if(!confirm(`Delete ${ids.length} cancelled order(s)? This cannot be undone.`))return;const {error}=await db.from('orders').delete().in('id',ids);if(error)return toast(error.message);await loadData();toast(`${ids.length} cancelled order(s) deleted`)}

  function updateBadges(){
    $('#ordersBadge').textContent=orders.filter(o=>['pending','confirmed','preparing','ready'].includes(norm(o.status))).length;
    $('#cateringBadge').textContent=catering.filter(x=>['new','contacted'].includes(norm(x.status))).length;
    $('#inquiryBadge').textContent=inquiries.filter(x=>['new','contacted'].includes(norm(x.status))).length;
  }

  function fillCategories(){const sel=$('#menuCategory');if(!sel)return;const current=sel.value;const cats=[...new Set(products.map(p=>p.category).filter(Boolean).map(String))].sort();sel.innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');sel.value=cats.includes(current)?current:''}
  function renderMenu(){
    const box=$('#foods');if(!box)return;fillCategories();const q=($('#menuSearch')?.value||'').toLowerCase().trim(),cat=$('#menuCategory')?.value||'';const list=products.filter(f=>(!q||`${f.name} ${f.category||''} ${f.description||''}`.toLowerCase().includes(q))&&(!cat||f.category===cat));
    if(!list.length){box.innerHTML='<div class="panel empty-card"><p>No matching menu items.</p></div>';return}
    box.innerHTML=list.map(f=>{const available=f.available!==false;const image=f.image_url?`<img class="food-img" src="${esc(f.image_url)}" alt="${esc(f.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:`<div class="food-img empty">No image</div>`;return `<article class="food food-card"><div>${image}<div class="food-img empty" style="display:none">Image unavailable</div></div><h3>🍽️ ${esc(f.name)}</h3><p>${money(f.price)}</p><small>${esc(f.category||'Menu')} · <span class="${available?'available':'unavailable'}">${available?'Available':'Unavailable'}</span></small>${f.description?`<p class="food-desc">${esc(f.description)}</p>`:''}<div class="food-actions"><button class="edit" data-edit-food="${esc(f.id)}">✏️ Edit</button><button data-toggle-food="${esc(f.id)}">${available?'⏸ Hide':'▶️ Show'}</button><button class="delete" data-delete-food="${esc(f.id)}">🗑️</button></div></article>`}).join('');
    box.querySelectorAll('[data-edit-food]').forEach(b=>b.onclick=()=>openFoodModal(products.find(x=>String(x.id)===String(b.dataset.editFood))));box.querySelectorAll('[data-toggle-food]').forEach(b=>b.onclick=()=>toggleFood(b.dataset.toggleFood));box.querySelectorAll('[data-delete-food]').forEach(b=>b.onclick=()=>deleteFood(b.dataset.deleteFood));
  }

  function openFoodModal(food=null){
    $('#foodModalTitle').textContent=food?'Edit Food':'Add Food';$('#foodId').value=food?.id||'';$('#foodName').value=food?.name||'';$('#foodPrice').value=food?.price??'';$('#foodCategory').value=food?.category||'';$('#foodDescription').value=food?.description||'';$('#foodImageUrl').value=food?.image_url||'';$('#foodAvailable').checked=food?.available!==false;$('#foodImageFile').value='';const p=$('#imagePreview');p.innerHTML=food?.image_url?`<img src="${esc(food.image_url)}" alt="Preview">`:'<span>No image selected</span>';$('#foodModal').classList.add('show');$('#foodModal').setAttribute('aria-hidden','false')}
  function closeFoodModal(){$('#foodModal').classList.remove('show');$('#foodModal').setAttribute('aria-hidden','true')}
  function previewUrl(){const url=$('#foodImageUrl').value.trim();if(url)$('#imagePreview').innerHTML=`<img src="${esc(url)}" alt="Preview">`;}
  function previewSelectedImage(){const file=$('#foodImageFile').files?.[0];if(!file)return;const reader=new FileReader();reader.onload=e=>$('#imagePreview').innerHTML=`<img src="${e.target.result}" alt="Preview">`;reader.readAsDataURL(file)}
  async function uploadImage(file){
    if(!file)return null;const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`${crypto.randomUUID()}.${ext}`;
    const {error}=await db.storage.from('product-images').upload(path,file,{upsert:false,contentType:file.type});if(error)throw new Error('Image upload failed. Create the public "product-images" bucket first.');
    const {data}=db.storage.from('product-images').getPublicUrl(path);return data.publicUrl;
  }
  async function saveFood(e){
    e.preventDefault();const btn=$('#saveFood');btn.disabled=true;btn.textContent='Saving…';try{
      let imageUrl=$('#foodImageUrl').value.trim()||null;const file=$('#foodImageFile').files?.[0];if(file)imageUrl=await uploadImage(file);
      const row={name:$('#foodName').value.trim(),price:Number($('#foodPrice').value),category:$('#foodCategory').value.trim()||null,description:$('#foodDescription').value.trim()||null,image_url:imageUrl,available:$('#foodAvailable').checked};if(!row.name||Number.isNaN(row.price)||row.price<0)throw new Error('Enter a valid food name and price.');
      const id=$('#foodId').value;if(id){const {error}=await db.from('products').update(row).eq('id',id);if(error)throw error;toast('Food updated successfully')}else{const {error}=await db.from('products').insert(row);if(error)throw error;toast('Food added successfully')}closeFoodModal();await loadData();
    }catch(err){console.error(err);toast(err.message||'Unable to save food')}finally{btn.disabled=false;btn.textContent='Save Food'}
  }
  async function toggleFood(id){const food=products.find(x=>String(x.id)===String(id));if(!food)return;const {error}=await db.from('products').update({available:food.available===false}).eq('id',id);if(error)return toast(error.message);await loadData();toast(food.available===false?'Food is available again':'Food hidden from menu')}
  async function deleteFood(id){const food=products.find(x=>String(x.id)===String(id));if(!food)return;if(!confirm(`Delete "${food.name}" from the menu?`))return;const {error}=await db.from('products').delete().eq('id',id);if(error)return toast(error.message);await loadData();toast('Food deleted')}

  function buildCustomers(){const map=new Map();orders.forEach(o=>{const key=o.phone||o.customer_name||o.id;const c=map.get(key)||{name:o.customer_name||'Customer',phone:o.phone||'',orders:0,total:0,last:o.created_at};c.orders++;c.total+=Number(o.grand_total??o.total??0);if(new Date(o.created_at)>new Date(c.last))c.last=o.created_at;map.set(key,c)});customers=[...map.values()].sort((a,b)=>new Date(b.last)-new Date(a.last))}
  function renderCustomers(){buildCustomers();const body=$('#customersBody');if(!body)return;const q=($('#customerSearch')?.value||'').toLowerCase().trim();const list=customers.filter(c=>`${c.name} ${c.phone}`.toLowerCase().includes(q));body.innerHTML=list.length?list.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.phone)}<br><button class="link-btn" data-customer-wa="${esc(c.phone)}">WhatsApp</button></td><td>${c.orders}</td><td>${money(c.total)}</td><td>${esc(c.last?new Date(c.last).toLocaleString('en-NG'):'—')}</td><td><button class="danger small-action" onclick="deleteCustomer('${esc(c.phone)}')">Delete</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No customers found.</td></tr>';body.querySelectorAll('[data-customer-wa]').forEach(b=>b.onclick=()=>wa(b.dataset.customerWa))}

  window.deleteCustomer=async phone=>{if(!phone)return;if(!confirm(`Delete all orders and history for ${phone}? This cannot be undone.`))return;const {error}=await db.from('orders').delete().eq('phone',phone);if(error)return toast(error.message);await db.from('customers').delete().eq('phone',phone);await loadData();toast('Customer history deleted')}

  async function updateCateringStatus(id,status){const {error}=await db.from('catering_requests').update({status}).eq('id',id);if(error)return toast(error.message);await loadData();toast('Catering status updated')}
  function renderCatering(){const box=$('#cateringGrid');if(!box)return;if(!catering.length){box.innerHTML='<div class="panel empty-card"><p>No real catering requests yet.</p></div>';return}box.innerHTML=catering.map(x=>`<article><b>✦ ${esc(x.event_type||'Catering request')}</b><p>Customer: ${esc(x.customer_name||'—')}<br>Phone: ${esc(x.phone||'—')}<br>Guests: ${esc(x.guests||'—')}<br>Date: ${esc(x.event_date||'—')}<br>Location: ${esc(x.location||'—')}<br>${esc(x.request||'')}</p><div class="request-actions"><select data-cat-status="${esc(x.id)}">${['new','contacted','quoted','confirmed','completed','cancelled'].map(s=>`<option value="${s}" ${s===norm(x.status||'new')?'selected':''}>${s}</option>`).join('')}</select><button class="primary" data-wa="${esc(x.phone||'')}">WhatsApp</button></div></article>`).join('');box.querySelectorAll('[data-cat-status]').forEach(s=>s.onchange=()=>updateCateringStatus(s.dataset.catStatus,s.value));box.querySelectorAll('[data-wa]').forEach(b=>b.onclick=()=>wa(b.dataset.wa))}

  async function updateInquiryStatus(id,status){const {error}=await db.from('food_inquiries').update({status}).eq('id',id);if(error)return toast(error.message);await loadData();toast('Inquiry status updated')}
  function renderInquiries(){const box=$('#inquiryGrid');if(!box)return;if(!inquiries.length){box.innerHTML='<div class="panel empty-card"><p>No real food inquiries yet.</p></div>';return}box.innerHTML=inquiries.map(x=>`<article><b>💬 ${esc(x.food_requested||'Food inquiry')}</b><p>Quantity: ${esc(x.quantity||'—')}<br>Date: ${esc(x.requested_date||'—')}<br>Customer: ${esc(x.customer_name||'—')}<br>Phone: ${esc(x.phone||'—')}<br>Details: ${esc(x.details||'—')}</p><div class="request-actions"><select data-inq-status="${esc(x.id)}">${['new','contacted','quoted','closed','cancelled'].map(s=>`<option value="${s}" ${s===norm(x.status||'new')?'selected':''}>${s}</option>`).join('')}</select><button class="primary" data-wa="${esc(x.phone||'')}">WhatsApp</button></div></article>`).join('');box.querySelectorAll('[data-inq-status]').forEach(s=>s.onchange=()=>updateInquiryStatus(s.dataset.inqStatus,s.value));box.querySelectorAll('[data-wa]').forEach(b=>b.onclick=()=>wa(b.dataset.wa))}


  function renderBranches(){
    const box=$('#branchesGrid');if(!box)return;
    if(!branches.length){box.innerHTML='<div class="panel empty-card"><p>No locations saved yet. Click Add Location.</p></div>';return}
    box.innerHTML=branches.map(b=>{
      const map='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.address||'');
      return `<article><b>📍 ${esc(b.name||'Location')}</b><p>${esc(b.address||'')}</p><small>${esc(b.type||'Branch')} · ${esc(b.city||'')} · ${b.active!==false?'Active':'Hidden'}</small><div class="branch-actions"><a class="secondary" target="_blank" rel="noopener" href="${map}">Map →</a><button class="primary" onclick="editBranch(${Number(b.id)})">Edit</button><button class="secondary" onclick="toggleBranch(${Number(b.id)})">${b.active!==false?'Hide':'Show'}</button><button class="danger" onclick="deleteBranch(${Number(b.id)})">Delete</button></div></article>`;
    }).join('');
  }
  function openBranchModal(branch=null){
    $('#branchModalTitle').textContent=branch?'Edit Location':'Add Location';
    $('#branchId').value=branch?.id||'';$('#branchName').value=branch?.name||'';$('#branchType').value=branch?.type||'Branch';$('#branchAddress').value=branch?.address||'';$('#branchCity').value=branch?.city||'';$('#branchActive').checked=branch?.active!==false;
    $('#branchModal').classList.add('show');$('#branchModal').setAttribute('aria-hidden','false');
  }
  function closeBranchModal(){$('#branchModal')?.classList.remove('show');$('#branchModal')?.setAttribute('aria-hidden','true')}
  window.editBranch=id=>{const b=branches.find(x=>Number(x.id)===Number(id));if(b)openBranchModal(b)}
  async function saveBranch(e){
    e.preventDefault();
    const id=$('#branchId').value.trim(),row={name:$('#branchName').value.trim(),type:$('#branchType').value.trim()||'Branch',address:$('#branchAddress').value.trim(),city:$('#branchCity').value.trim(),active:$('#branchActive').checked};
    if(!row.name||!row.address)return toast('Name and address are required');
    let result=id?await db.from('branches').update(row).eq('id',id):await db.from('branches').insert({...row,sort_order:branches.length?Math.max(...branches.map(x=>Number(x.sort_order)||0))+1:1});
    if(result.error)return toast(result.error.message);
    closeBranchModal();await loadData();toast('Location saved');
  }
  window.toggleBranch=async id=>{const b=branches.find(x=>Number(x.id)===Number(id));if(!b)return;const {error}=await db.from('branches').update({active:b.active===false}).eq('id',id);if(error)return toast(error.message);await loadData();toast(b.active===false?'Location shown':'Location hidden')}
  window.deleteBranch=async id=>{const b=branches.find(x=>Number(x.id)===Number(id));if(!b)return;if(!confirm(`Delete "${b.name}"?`))return;const {error}=await db.from('branches').delete().eq('id',id);if(error)return toast(error.message);await loadData();toast('Location deleted')}


  async function uploadAdImage(file){
    if(!file)return null;const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`advert-${crypto.randomUUID()}.${ext}`;
    const {error}=await db.storage.from('product-images').upload(path,file,{upsert:false,contentType:file.type});if(error)throw new Error('Advert image upload failed: '+error.message);
    const {data}=db.storage.from('product-images').getPublicUrl(path);return data.publicUrl;
  }
  function previewAdUrl(){const url=$('#adImageUrl')?.value.trim();const box=$('#adImagePreview');if(!box)return;box.innerHTML=url?`<img src="${esc(url)}" alt="Advert preview" onerror="this.style.display='none'">`:'<span>No image selected</span>'}
  function previewAdImage(){const file=$('#adImageFile')?.files?.[0],box=$('#adImagePreview');if(!box)return;if(!file){previewAdUrl();return}const r=new FileReader();r.onload=()=>box.innerHTML=`<img src="${r.result}" alt="Advert preview">`;r.readAsDataURL(file)}
  function openAdModal(ad=null){$('#adModalTitle').textContent=ad?'Edit Advert':'Add Advert';$('#adId').value=ad?.id||'';$('#adTitle').value=ad?.title||'';$('#adBody').value=ad?.body||'';$('#adImageUrl').value=ad?.image_url||'';$('#adButtonText').value=ad?.button_text||'Order Now';$('#adButtonLink').value=ad?.button_link||'';$('#adActive').checked=ad?.active!==false;$('#adImageFile').value='';previewAdUrl();$('#adModal').classList.add('show');$('#adModal').setAttribute('aria-hidden','false')}
  function closeAdModal(){$('#adModal')?.classList.remove('show');$('#adModal')?.setAttribute('aria-hidden','true')}
  window.editAd=id=>{const a=ads.find(x=>String(x.id)===String(id));if(a)openAdModal(a)}
  window.deleteAd=async id=>{const a=ads.find(x=>String(x.id)===String(id));if(!a)return;if(!confirm(`Delete advert "${a.title}"?`))return;const {error}=await db.from('advertisements').delete().eq('id',id);if(error)return toast(error.message);await loadData();toast('Advert deleted')}
  window.toggleAd=async id=>{const a=ads.find(x=>String(x.id)===String(id));if(!a)return;const {error}=await db.from('advertisements').update({active:a.active===false}).eq('id',id);if(error)return toast(error.message);await loadData();toast(a.active===false?'Advert shown':'Advert hidden')}
  async function saveAd(e){e.preventDefault();const btn=$('#saveAd');btn.disabled=true;btn.textContent='Saving…';try{let imageUrl=$('#adImageUrl').value.trim()||null;const file=$('#adImageFile').files?.[0];if(file)imageUrl=await uploadAdImage(file);const row={title:$('#adTitle').value.trim(),body:$('#adBody').value.trim()||null,image_url:imageUrl,button_text:$('#adButtonText').value.trim()||'Order Now',button_link:$('#adButtonLink').value.trim()||null,active:$('#adActive').checked};if(!row.title)throw new Error('Enter an advert title.');const id=$('#adId').value.trim();const result=id?await db.from('advertisements').update(row).eq('id',id):await db.from('advertisements').insert(row);if(result.error)throw result.error;closeAdModal();await loadData();toast(id?'Advert updated':'Advert created')}catch(err){toast(err.message||'Unable to save advert')}finally{btn.disabled=false;btn.textContent='Save Advert'}}
  function renderAds(){const box=$('#adsGrid');if(!box)return;if(!ads.length){box.innerHTML='<div class="panel empty-card"><p>No advertisements yet. Click Add Advert.</p></div>';return}box.innerHTML=ads.map(a=>`<article class="ad-admin-card"><div class="ad-admin-image">${a.image_url?`<img src="${esc(a.image_url)}" alt="${esc(a.title)}">`:'<span>📢 No image</span>'}</div><span class="tag">${a.active!==false?'LIVE':'HIDDEN'}</span><h3>${esc(a.title)}</h3><p>${esc(a.body||'')}</p><small>${esc(a.button_text||'Order Now')} · ${esc(a.button_link||'No link')}</small><div class="branch-actions"><button class="primary" onclick="editAd(${Number(a.id)})">Edit</button><button class="secondary" onclick="toggleAd(${Number(a.id)})">${a.active!==false?'Hide':'Show'}</button><button class="danger" onclick="deleteAd(${Number(a.id)})">Delete</button></div></article>`).join('')}

  function renderReports(){
    const now=new Date(),start7=new Date(now);start7.setDate(now.getDate()-6);const month=orders.filter(o=>{const d=new Date(o.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()});const week=orders.filter(o=>new Date(o.created_at)>=new Date(start7.setHours(0,0,0,0)));const valid=o=>norm(o.status)!=='cancelled';const sum=a=>a.filter(valid).reduce((s,o)=>s+Number(o.grand_total??o.total??0),0);const completed=orders.filter(o=>['delivered','completed'].includes(norm(o.status)));$('#reportWeek').textContent=money(sum(week));$('#reportMonth').textContent=money(sum(month));$('#reportAverage').textContent=money(completed.length?sum(completed)/completed.length:0);$('#reportDelivery').textContent=money(sum(month.map(o=>o)));
    const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toLocaleDateString('en-CA');const total=sum(orders.filter(o=>String(o.created_at||'').slice(0,10)===key));days.push({label:d.toLocaleDateString('en-NG',{weekday:'short'}),total})}const max=Math.max(...days.map(x=>x.total),1);$('#salesBars').innerHTML=days.map(d=>`<div class="bar-day"><b>${money(d.total)}</b><div class="bar-fill" style="height:${Math.max(2,d.total/max*170)}px"></div><small>${d.label}</small></div>`).join('')
  }
  function exportCSV(){const rows=[['Order','Customer','Phone','Subtotal','Delivery Fee','Total','Method','Delivery Location','Status','Created'],...orders.map(o=>[o.id,o.customer_name,o.phone,o.subtotal,o.delivery_fee,o.grand_total??o.total,o.fulfillment_method,o.delivery_location,o.status,o.created_at])];const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='realex-orders.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

  function loadSettings(){const s=JSON.parse(localStorage.getItem('realex_admin_settings')||'{}');Object.entries({setName:'name',setEmail:'email',setPhone:'phone',setPhone2:'phone2',setHours:'hours',setDescription:'description'}).forEach(([id,k])=>{if(s[k]!==undefined)$('#'+id).value=s[k]})}
  function saveSettings(){const s={name:$('#setName').value.trim(),email:$('#setEmail').value.trim(),phone:$('#setPhone').value.trim(),phone2:$('#setPhone2').value.trim(),hours:$('#setHours').value.trim(),description:$('#setDescription').value.trim()};localStorage.setItem('realex_admin_settings',JSON.stringify(s));toast('Settings saved on this admin device')}

  async function init(){try{bindNav();loadSettings();await connectAdmin();await loadData();setInterval(()=>loadData().catch(console.error),30000)}catch(err){console.error(err);document.body.innerHTML=`<main style="padding:30px;font-family:system-ui"><h2>Realex Cosset Admin</h2><p>${esc(err.message||'Unable to connect.')}</p><a href="admin-login.html">Back to login</a></main>`}}
  document.addEventListener('click', async function(e) {
  const logout = e.target.closest('#logoutBtn');

  if (!logout) return;

  logout.disabled = true;
  logout.textContent = '↪ Logging out...';

  try {
    if (db) {
      await db.auth.signOut();
    }

    window.location.href = 'admin-login.html';

  } catch (error) {
    console.error('Logout error:', error);
    logout.disabled = false;
    logout.textContent = '↪ Logout';
    alert('Logout failed. Please try again.');
  }
});
  document.addEventListener('DOMContentLoaded',init);
})();

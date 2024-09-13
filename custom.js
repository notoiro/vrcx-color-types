// settings
const load_wait = 3;

let parent_tab = 'unknown';
// Friend Logは作者が非表示にしてるので非対応。
// Notificationは面倒な割にあんまり使う気がしないので非対応。
const icon_type_list = {
  'el-icon-news': 'feed',
  'el-icon-s-data': 'gamelog'
}

const selectors = {
  feed: '.el-table_1_column_3:not(.is-leaf) > .cell',
  gamelog: '.el-table_2_column_7:not(.is-leaf) > .cell > span'
}

const text_template = {
  'Online': 'color_online',
  'Offline': 'color_offline',
  'GPS': 'color_gps',
  'Status': 'color_status',
  'Bio': 'color_bio',
  'Avatar': 'color_avatar',
  
  'OnPlayerJoined': 'color_online',
  'OnPlayerLeft': 'color_offline',
  'Location': 'color_gps',
  'PortalSpawn': 'color_status',
  'Event': 'color_bio',
  'VideoPlay': 'color_avatar',
  // 見たことないのでとりあえずEventと同じ扱いで
  'Extarnal': 'color_bio',
  'StringLoad': 'color_bio',
  'ImageLoad': 'color_bio'
};

const stylesheet = `
.color_online{
  color: #5dc65d;
}

.color_offline{
  color: #e85a33;
}

.color_gps{
  color: #41c6c6;
}

.color_status{
  color: #eacc52;
}

.color_bio{
  color: #bc52ea;
}

.color_avatar{
  color: #ea52d6;
}
`;

const get_current_mode = () => {
  const active_tab = document.querySelector('.el-menu-item.is-active');
  const icon = active_tab.querySelector('i');
  
  return icon_type_list[icon.classList[0]] ?? 'unsupported';
}

const tab_check = () => {
  const current_tab = get_current_mode();
  if(parent_tab !== current_tab){
    // 更新する
    console.log(`change tab: ${current_tab}`);
    change_page();
    parent_tab = current_tab;
  }
}

const apply_color = (el, color) => {
  el.classList.remove(...Object.values(text_template));
  el.classList.add(color);
}

const change_page = () => {
  const current_tab = get_current_mode();
  
  let arr;
  switch(current_tab){
    case 'feed':
      arr = document.querySelectorAll(selectors.feed);
      break;
    case 'gamelog':
      arr = document.querySelectorAll(selectors.gamelog);
      break;
  }
  
  if(arr){
    for(let f of arr){
      const color = text_template[f.textContent];
      if(color) apply_color(f, color);
    }
  }
}

const callback = (mutations) => {
  for(const mut of mutations){
    if(mut.target.parentElement.classList.contains('el-pagination__total')){
      parent_tab = 'unknown';
    }
    // タブの切り替えチェック
    tab_check();
    let color, target;
    
    if(mut.type === 'characterData'){
      color = text_template[mut.target.data];
      target = mut.target.parentElement;
    }else if(mut.type === 'childList'){
      color = text_template[mut.target.textContent];
      target = mut.target;
    }
    
    if(color) apply_color(target, color);
  }
}

const sub_callback = (_) => {
  tab_check();
}

const main = () => {
  // CSSの追加
  const style_tag = document.createElement('style');
  style_tag.textContent = stylesheet;
  document.head.appendChild(style_tag);
  
  // メインObserver。中身の監視をする。
  const obs_target = document.querySelector('.x-app');
  const opt = {
    childList: true,
    attributes: false,
    subtree: true,
    characterData: true
  };
  
  const main_obs = new MutationObserver(callback);
  main_obs.observe(obs_target, opt);
  
  // サブObserver。タブの切り替えを監視する。
  const sub_obs_target = document.querySelector('.x-menu-container');
  const sub_opt = {
    childList: false,
    attributes: true,
    subtree: true
  };
  
  const sub_obs = new MutationObserver(sub_callback);
  sub_obs.observe(sub_obs_target, sub_opt);
}

setTimeout(main, load_wait * 1000);
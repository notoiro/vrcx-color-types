let parent_tab = 'unknown';
// Friend Logは作者が非表示にしてるので非対応。
// Notificationは面倒な割にあんまり使う気がしないので非対応。
const icon_type_list = {
  'ri-rss-line': 'feed',
  'ri-history-line': 'gamelog'
}

const selectors = {
  feed: '.feed .el-table__cell:nth-child(3):not(.is-leaf) > .cell > span',
  gamelog: '.el-table__cell:nth-child(2):not(.is-leaf) > .cell > span'
}

const text_template = {
  'Online': 'color_online',
  'Offline': 'color_offline',
  'GPS': 'color_gps',
  'Status': 'color_status',
  'Bio': 'color_bio',
  'Avatar': 'color_avatar',

  'オンライン': 'color_online',
  'オフライン': 'color_offline',
  '現在地': 'color_gps',
  'ステータス': 'color_status',
  '自己紹介': 'color_bio',
  'アバター': 'color_avatar',

  'Player joined': 'color_online',
  'Player left': 'color_offline',
  'Location': 'color_gps',
  'Event': 'color_bio',
  'Video play': 'color_avatar',
  // 見たことないのでとりあえずEventと同じ扱いで
  'Extarnal': 'color_bio',
  'String load': 'color_bio',
  'Image load': 'color_bio',

  'プレイヤー参加': 'color_online',
  'プレイヤー退出': 'color_offline',
  '場所': 'color_gps',
  'イベント': 'color_bio',
  '動画を再生': 'color_avatar',
  '外的': 'color_bio',
  'URIの読み込み': 'color_bio',
  '画像の読み込み': 'color_bio'
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
  if(!active_tab) return 'setting';
  const icon = active_tab.querySelector('i');

  return icon_type_list[icon.classList[0]] ?? 'unsupported';
}

const tab_check = () => {
  let now_current_tab = get_current_mode();
  if(parent_tab !== now_current_tab){
    // 設定から元居たタブに戻る場合、検出に使っているUI要素が正しく動かない。よって雑なハックをする。
    if(now_current_tab === 'setting'){
      const true_currnet_tab = parent_tab;
      wait_for_elements('body:not(:has(.options-container))', () => {
        if(get_current_mode() === 'setting'){
          console.log('setting bug!');
          console.log(`true current tab is ${true_currnet_tab}`);
          let selector;
          if(true_currnet_tab === 'feed') selector = 'ri-rss-line';
          else if(true_currnet_tab === 'gamelog') selector = 'ri-history-line';

          if(selector){
            document.querySelector(`.el-menu-item:has(i.${selector})`)?.classList.add('is-active');
            tab_check();
          }
        }
      });
    }
    // 更新する
    console.log(`change tab: ${now_current_tab}`);
    change_page();
    parent_tab = now_current_tab;
  }
}

const apply_color = (el, color) => {
  el.classList.remove(...Object.values(text_template));
  el.classList.add(color);
}

const change_page = () => {
  const current_tab = get_current_mode();

  let name, selector;

  switch(current_tab){
    case 'feed':
      selector = selectors.feed;
      name = ".feed";
      break;
    case 'gamelog':
      selector = selectors.gamelog;
      name = ".x-container:not(.feed)"
      break;
  }

  const f = () => {
    const arr = document.querySelectorAll(selector);
    if(arr){
      for(let f of arr){
        const color = text_template[f.textContent];
        if(color) apply_color(f, color);
      }
    }
  }

  wait_for_elements(name, f, 30000);
}

const callback = (mutations) => {
  for(const mut of mutations){
    if(mut.target.parentElement.classList.contains('el-pagination__total')){
      parent_tab = 'unknown';
    }
    // タブの切り替えチェック
    tab_check();
    let color, target, row;

    if(mut.type === 'characterData'){
      color = text_template[mut.target.data];
      target = mut.target.parentElement;
    }else if(mut.type === 'childList'){
      if(mut.addedNodes.length && mut.target.nodeName === "TBODY"){
        change_page();
        return;
      }

      color = text_template[mut.target.textContent];
      target = mut.target;
    }

    const current_tab = get_current_mode();

    if(current_tab === "feed") row = 2;
    else if(current_tab === "gamelog") row = 1;
    else row = 2;

    const parent = target.offsetParent;
    const row_parent = parent?.parentElement?.children?.[row];
    if(parent && color && (parent === row_parent)){
      apply_color(target, color);
    }
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

  wait_for_elements(selectors.feed, change_page);
}

const wait_for_elements = (name, callback, break_time = null) => {
  const interval = setInterval(() => {
    const el = document.querySelector(name);
    if(el){
      clearInterval(interval);
      callback();
    }
  }, 100);

  if(break_time){
    setTimeout(() => clearInterval(interval), break_time);
  }
}

wait_for_elements('.el-menu', main);

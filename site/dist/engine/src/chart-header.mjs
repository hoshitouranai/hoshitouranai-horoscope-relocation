export const CHART_HEADER = Object.freeze({
  single: {
    title: 'シングルチャート作成',
    subtitle: '出生図・イベント図・トランジット',
    guide: [
      ['出生図', 'ネイタルを選び、出生地と現地の出生日時を入力すると、その瞬間のホロスコープを作成できます。'],
      ['イベント図', '下のイベント検索から新月・満月・入座を選ぶと、指定した地点でのイベント図を表示できます。任意の出来事は、ネイタルの入力欄に日時と地点を指定して作図できます。'],
      ['トランジット', 'トランジットを選び、調べたい日時と地点を指定すると、その時点の天体配置を単独で確認できます。'],
      ['画像保存', '作成したチャートを16:9（YouTube用）または正方形のPNGで保存できます。'],
    ],
  },
  double: {
    title: 'ダブルチャート作成',
    subtitle: '2つのホロスコープを重ねて比較',
    guide: [
      ['比較方法', '内円の基準図と外円の比較図を重ねます。出生図と経過図、2人の出生図、イベント図と経過図から選べます。'],
      ['アスペクト', '円間のアスペクトを選んで線を表示できます。基準図・比較図をそれぞれ単独でも確認できます。'],
      ['ハーフサム・コンポジット', 'ハーフサムは一覧、360°チャート、90°ダイヤルで確認できます。基準地方式のコンポジットは比較方法から開けます（検証用）。'],
      ['画像保存', '作成したチャートを16:9（YouTube用）または正方形のPNGで保存できます。'],
    ],
  },
  triple: {
    title: 'トリプルチャート作成',
    subtitle: '3つのホロスコープを重ねて比較',
    guide: [
      ['3つの円', '内円に出生図、外円に対象日時のトランジットを表示します。中円はプログレス（二次進行）とソーラーアークから選べます。'],
      ['天体・アングル・ハウス', '円盤の軸とハウスは出生図が基準です。各円の天体位置、ASC・MC、ハウスカスプは下の表で比較できます。'],
      ['アスペクトとハーフサム', '比較する円を選び、アスペクトを一覧で確認できます。出生図のハーフサムに中円・外円の天体が接触しているかも調べられます。'],
      ['画像保存', '作成したチャートを16:9（YouTube用）のPNGで保存できます。'],
    ],
  },
});

export function mountChartHeader(root, kind) {
  const document = root.ownerDocument;
  const title = root.querySelector('h1');
  const subtitle = root.querySelector('[data-chart-subtitle]');
  const guide = root.querySelector('[data-chart-guide]');
  const details = guide.closest('details');
  let active;
  return function selectKind(next = kind) {
    if (!Object.hasOwn(CHART_HEADER, next) || next === active) return;
    active = next;
    const content = CHART_HEADER[next];
    title.textContent = content.title;
    subtitle.textContent = content.subtitle;
    document.title = content.title + '｜HOSHITOURANAI';
    details.open = false;
    const entries = content.guide.flatMap(([label, description]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const definition = document.createElement('dd');
      definition.textContent = description;
      return [term, definition];
    });
    guide.replaceChildren(...entries);
  };
}

const root = globalThis.document?.querySelector('[data-chart-header]');
if (root) {
  const selector = document.querySelector('#chartKind');
  const requested = new URLSearchParams(location.search).get('chart');
  const kind = selector && [...selector.options].some(option => option.value === requested)
    ? requested : selector?.value ?? root.dataset.chartHeader;
  const selectKind = mountChartHeader(root, kind);
  selectKind();
  selector?.addEventListener('change', () => selectKind(selector.value));
}

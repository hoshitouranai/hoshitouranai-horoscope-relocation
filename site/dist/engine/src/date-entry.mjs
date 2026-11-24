export function enableKeyboardDateEntry(inputs){
  const explicit=new URLSearchParams(location.search).get('date-entry')==='keyboard';
  const platform=navigator.userAgentData?.platform || navigator.platform;
  if(!explicit && !/^Win/i.test(platform)) return false;

  for(const input of inputs){
    input.type='text';
    input.placeholder='2000年12月23日';
  }
  if(explicit){
    for(const link of document.querySelectorAll('.chart-navigation a[href]')){
      const url=new URL(link.href);
      url.searchParams.set('date-entry','keyboard');
      link.href=url.href;
    }
  }
  return true;
}

export function normalizeChartDate(value){
  const normalized=value.normalize('NFKC').trim().replace(/\s+/gu,'').replace(
    /^(\d{4})年(\d{1,2})月(\d{1,2})日$/u,'$1/$2/$3'
  );
  const parts=/^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/.exec(normalized);
  if(!parts) throw new RangeError('日付を入力してください（例：2000年12月23日、2000/12/23）。');
  const [,year,,month,day]=parts;
  const date=[year,month.padStart(2,'0'),day.padStart(2,'0')].join('-');
  const instant=new Date(date+'T00:00:00Z');
  if(!Number.isFinite(instant.getTime())||instant.toISOString().slice(0,10)!==date){
    throw new RangeError('実在する日付を入力してください。');
  }
  return date;
}


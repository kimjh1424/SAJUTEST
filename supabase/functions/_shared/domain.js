export function validatePerson(value, today = new Date().toISOString().slice(0,10)) {
  if (!value || typeof value !== 'object') throw new Error('생년월일을 입력해 주세요.');
  const {birth, calendar, time = null, mbti = null, name = ''} = value;
  if (typeof name !== 'string' || name.length > 30 || /[\x00-\x1f]/.test(name)) throw new Error('이름은 30자 이내로 입력해 주세요.');
  if (!['solar','lunar','leap'].includes(calendar)) throw new Error('달력 종류를 확인해 주세요.');
  if (typeof birth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birth) || birth < '1900-01-01' || birth > today) throw new Error('생년월일 범위를 확인해 주세요.');
  const [year,month,day] = birth.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > (calendar === 'solar' ? new Date(Date.UTC(year,month,0)).getUTCDate() : 30)) throw new Error('존재하지 않는 날짜예요.');
  if (time !== null && (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) throw new Error('태어난 시간을 확인해 주세요.');
  if (mbti !== null && (typeof mbti !== 'string' || !/^[IE][NS][FT][JP]$/.test(mbti))) throw new Error('MBTI를 확인해 주세요.');
  return {name:name.trim(), birth, calendar, time, mbti};
}

export function calculate(person, library, today = new Date().toISOString().slice(0,10)) {
  const [year,month,day] = person.birth.split('-').map(Number);
  const [hour,minute] = (person.time || '12:00').split(':').map(Number);
  const lunar = person.calendar === 'solar'
    ? library.Solar.fromYmdHms(year,month,day,hour,minute,0).getLunar()
    : library.Lunar.fromYmdHms(year,person.calendar === 'leap' ? -month : month,day,hour,minute,0);
  const solar = lunar.getSolar().toYmd();
  if (solar > today) throw new Error('미래 생년월일은 사용할 수 없어요.');
  const eight = lunar.getEightChar();
  eight.setSect(2);
  return {solar,year:eight.getYear(),month:eight.getMonth(),day:eight.getDay(),hour:person.time ? eight.getTime() : null, basis:'입력 시각 그대로, 진태양시 보정 없음. 음력은 중국 음력 기준. 시간 미상은 시주 제외.'};
}

export function validToken(token) { return typeof token === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token); }

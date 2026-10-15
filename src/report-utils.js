export function cleanReading(value) {
  return String(value || '').replace(/\r\n/g,'\n')
    .replace(/^\s*(?:\*\s*){3,}$/gm,'')
    .replace(/\*+/g,'')
    .replace(/^\s*#{1,6}\s+/gm,'')
    .replace(/`+/g,'')
    .replace(/\n{3,}/g,'\n\n').trim();
}

export function reportSections(value) {
  const text = cleanReading(value);
  const sections=[];
  for (const block of text.split(/\n\s*\n/).filter(Boolean)) {
    for (const line of block.split('\n')) {
      const heading=line.trim().match(/^\[([^\]\n]{1,60})\]$/);
      if (heading) sections.push({title:heading[1],body:''});
      else {
        if (!sections.length) sections.push({title:'먼저, 너의 이야기',body:''});
        const last=sections[sections.length-1];
        last.body += (last.body ? '\n' : '')+line;
      }
    }
    if (sections.length && sections[sections.length-1].body) sections[sections.length-1].body+='\n';
  }
  return sections.map(section=>({...section,body:section.body.trim()})).filter(section=>section.body);
}

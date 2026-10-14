"""Search the official list by exact card title and cache artwork candidates."""
import argparse
import html
import io
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

def fetch(url, path):
    if path.exists(): return path.read_bytes()
    path.parent.mkdir(parents=True,exist_ok=True)
    request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (card art research)'})
    data=urllib.request.urlopen(request,timeout=45).read()
    return data

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('name',help='Official English card title to match exactly')
    parser.add_argument('--cache',type=Path,default=Path('extracted/newart'))
    parser.add_argument('--download',type=int,default=0,metavar='N',help='Download up to N regular candidates for visual review')
    args=parser.parse_args()
    if args.download<0: parser.error('--download must be nonnegative')
    url='https://world.digimoncard.com/cardlist/?'+urllib.parse.urlencode({'search':'true','free':args.name})
    key=re.sub(r'[^a-zA-Z0-9_-]','_',args.name)
    page=args.cache/'search'/('official-'+key+'.html')
    raw=fetch(url,page); page.write_bytes(raw)
    cards=[]
    for block in re.split(r'<div class="popupCol" id="',raw.decode())[1:]:
        number=block.split('"')[0]
        title=re.search(r'<div class="cardTitle">\s*(.*?)\s*</div>',block,re.S)
        title=html.unescape(title.group(1)).strip() if title else ''
        if title.casefold()==args.name.casefold() and '_' not in number:
            cards.append(number)
    def order(number):
        parsed=re.match(r'(BT|EX|ST|P)(\d*)-(\d+)',number)
        return (int(parsed[2] or '0') if parsed else 999,number)
    cards=sorted(set(cards),key=order)
    downloaded=[]
    if args.download:
        from PIL import Image
        for number in cards[:args.download]:
            picture=args.cache/'cards'/(number+'.png')
            data=fetch('https://world.digimoncard.com/images/cardlist/card/'+number+'.png',picture)
            Image.open(io.BytesIO(data)).verify()
            picture.write_bytes(data); downloaded.append(str(picture))
    print(json.dumps({'name':args.name,'search_url':url,'regular_candidates':cards,'downloaded':downloaded},indent=2))

if __name__=='__main__': main()

# 10 s hook: music + SFX only (the voice is recorded by Davide in post)
import numpy as np, wave
SR=48000; DUR=46.0; N=int(SR*DUR)
rng=np.random.default_rng(3)
def put(b,t,x,g=1.0):
    i=int(t*SR); a=max(0,-i); e=min(len(x),N-i)
    if e>a: b[i+a:i+e]+=x[a:e]*g
def env(n,a=0.005,d=0.1,s=0.0,r=0.05):
    t=np.arange(n)/SR; L=n/SR
    e=np.where(t<a,t/a,np.exp(-(t-a)/max(d,1e-3))); e=np.maximum(e,s)
    return (e*np.clip((L-t)/r,0,1)).astype(np.float32)
def tone(f,dur,harm=(1,),amps=None,vib=0.0):
    t=np.arange(int(dur*SR))/SR; y=np.zeros_like(t)
    for k,h in enumerate(harm): y+=(1/(k+1) if amps is None else amps[k])*np.sin(2*np.pi*f*h*t+vib*np.sin(2*np.pi*5.5*t))
    return y.astype(np.float32)
def filt(x,lo=None,hi=None):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR)
    if hi: X*=1/(1+(f/hi)**4)
    if lo: X*=1-1/(1+(f/lo)**4)
    return np.fft.irfft(X,len(x)).astype(np.float32)
def noise(d): return (0.3*rng.standard_normal(int(d*SR))).astype(np.float32)
mid=lambda m:440*2**((m-69)/12)

music=np.zeros(N,np.float32); sfx=np.zeros(N,np.float32)
BEAT=60/112; E8=BEAT/2; BAR=BEAT*2
def pluck(t,m,g):
    x=tone(mid(m),0.35,(1,2,3),(1,.4,.15))*env(int(.35*SR),0.003,0.09,0,0.05); put(music,t,filt(x,hi=900),g)
def celesta(t,m,g=0.11,d=0.5):
    put(music,t,tone(mid(m),d,(1,2.76,5.4),(1,.3,.1))*env(int(d*SR),0.002,0.22,0,0.1),g)
def pad(t,ms,d,g=0.05):
    for m in ms: put(music,t,filt(tone(mid(m),d,(1,2,3),(1,.3,.1))*env(int(d*SR),0.4,9,0.6,0.6),hi=1400),g)
def snare(t,g=0.18): put(music,t,filt(noise(0.07),lo=2500)*env(int(.07*SR),0.001,0.025,0,0.02),g)
def kick(t,g=0.5):
    tt=np.arange(int(.18*SR))/SR; put(music,t,(np.sin(2*np.pi*(55+90*np.exp(-tt*30))*tt)*np.exp(-tt*16)).astype(np.float32),g)
def stab(t,ms,g=0.06):
    d=E8*0.8
    for m in ms: put(music,t,filt(tone(mid(m),d,(1,2,3,4),(1,.7,.5,.3))*env(int(d*SR),0.006,0.08,0,0.03),hi=2600),g)
# 0-12: elegant but lonely: slow minor plucks + celesta
prog=[(45,[57,60,64]),(41,[53,57,60]),(43,[55,59,62]),(40,[52,55,59])]
t=0.0; i=0
while t<13.2:
    r,ch=prog[(i//4)%4]
    pluck(t,r+12 if i%2 else r+19,0.3)
    if i%4==0: pad(t,ch,BEAT*4.2,0.035)
    t+=BEAT; i+=1
mel=[76,74,72,71,72,None,69,None,76,77,76,74,72,None,None,None,74,72,71,69]
for k,m in enumerate(mel):
    tt=0.4+k*E8*2
    if m and tt<13.0: celesta(tt,m,0.09,0.7)
# 12-31: Veloce arrives: major, upbeat groove
prog2=[(48,[60,64,67]),(43,[55,59,62]),(45,[57,60,64]),(41,[53,57,60])]
t=13.2; b=0
while t<42.0:
    r,ch=prog2[(b//2)%4]
    kick(t,0.45); pluck(t,r+12,0.32); pluck(t+BEAT,r+19,0.26)
    stab(t+E8,ch); stab(t+BEAT+E8,ch)
    snare(t+BEAT,0.2); snare(t+BEAT+E8*1.5,0.08)
    t+=BAR; b+=1
mel2=[72,76,79,76,77,76,74,72, 71,74,79,74,76,74,72,71, 69,72,76,72,74,72,71,69, 65,69,72,77,76,74,72,None]
for k in range(80):
    tt=13.2+k*E8
    if tt>=42: break
    m=mel2[k%len(mel2)]
    if m and 16.0<tt: celesta(tt,m+12 if 30<tt else m,0.08 if 30>tt else 0.1,0.45)
# end: bright resolved chord + shimmer
for m in (48,55,60,64,67,72,76):
    put(music,42.55,filt(tone(mid(m),3.2,(1,2,3),(1,.5,.3))*env(int(3.2*SR),0.01,1.6,0,0.9),hi=3000),0.07)
put(music,42.55,filt(noise(2.4),lo=5000)*env(int(2.4*SR),0.002,0.8,0,0.6),0.2)
# leave room for the voice (recorded in post): dip music under each line
lines=[(0.2,3.9),(4.6,10.7),(10.85,13.5),(13.6,15.3),(16.0,17.6),(18.85,23.05),(23.1,24.3),(24.25,30.2),(31.7,32.7),(35.0,38.5),(39.0,42.1),(42.7,43.7)]
duck=np.ones(N,np.float32)
for a,b2 in lines:
    i0=int((a-0.15)*SR); i1=int((b2+0.15)*SR); duck[i0:i1]=0.55
k=int(0.08*SR); duck=np.convolve(duck,np.ones(k)/k,mode='same').astype(np.float32)
music*=duck
def whoosh(t,d=0.35,g=0.25,f0=400,f1=4000):
    n=int(d*SR); x=noise(d); y=np.zeros(n,np.float32); B=1024
    for i in range(0,n,B):
        fc=f0*(f1/f0)**(i/n); seg=x[i:i+B]
        if len(seg)>16: y[i:i+B]=filt(seg,lo=fc*0.5,hi=fc*1.5)
    y*=np.sin(np.pi*np.linspace(0,1,n))**1.5; put(sfx,t,y,g*3)
def ting(t,m=91,g=0.2,d=0.8): put(sfx,t,tone(mid(m),d,(1,2.76,5.4),(1,.35,.12))*env(int(d*SR),0.002,0.3,0,0.2),g)
def step(t,g=0.1): put(sfx,t,filt(noise(0.05),hi=1200)*env(int(.05*SR),0.001,0.015,0,0.02),g*3)
def click(t,g=0.3,f=1500): put(sfx,t,filt(noise(0.04),lo=f)*env(int(.04*SR),0.0005,0.01,0,0.01),g*3)
def thud(t,g=0.5):
    tt=np.arange(int(.25*SR))/SR; put(sfx,t,(np.sin(2*np.pi*70*tt)*np.exp(-tt*18)).astype(np.float32),g)
def skid(t,g=0.2):
    d=0.45; x=filt(noise(d),lo=1500,hi=5000)*env(int(d*SR),0.01,0.2,0,0.1); put(sfx,t,x,g*3)
def yawn(t,g=0.14):
    d=0.9; tt=np.arange(int(d*SR))/SR; f0=420-180*tt/d
    y=sum(np.sin(2*np.pi*np.cumsum(f0*h)/SR)/h for h in (1,2,3)); y*=np.sin(np.pi*tt/d)
    put(sfx,t,filt(y.astype(np.float32),lo=200,hi=2500),g)
def shutter(t,g=0.3): click(t,g,900); click(t+0.06,g*0.8,2500)
def buzz(t,g=0.18):
    tt=np.arange(int(.25*SR))/SR; put(sfx,t,(np.sin(2*np.pi*120*tt)*np.sign(np.sin(2*np.pi*30*tt))*0.6).astype(np.float32)*env(len(tt),0.005,0.2,0,0.05),g)
def doorbell(t,g=0.25):
    for k2,m in enumerate((84,79)): ting(t+k2*0.28,m,g,1.2)
def boop(t,m,g=0.14): put(sfx,t,tone(mid(m),0.12,(1,2),(1,.3))*env(int(.12*SR),0.002,0.05,0,0.03),g)
# cuts get a soft air whoosh
S=5.0  # everything after the services montage is shifted by 5 s
for c in (1.5,2.9,4.4,5.7,7.0,8.3,9.6,11.0,13.2,14.6,16.0,17.4,18.8,21.4,22.6,23.8):
    whoosh(c-0.07,0.22,0.06)
for c in (25.0,26.6,27.8,30.0,31.6):
    whoosh(c+S-0.07,0.22,0.06)
for k2 in range(12): step(0.0+k2*0.36+(0.04 if k2%2 else 0),0.07)
for k2 in range(24): click(4.4+k2*0.11+(0.03 if k2%3 else 0),0.05,3500)
for k2 in range(6): step(7.0+k2*0.22,0.08)
thud(8.2,0.2)
ting(9.0,96,0.12); ting(10.3,93,0.12)
buzz(11.6,0.06)
doorbell(13.6,0.25)
for k2 in range(5): step(13.2+k2*0.3,0.08)
thud(15.0,0.25)
for tp in (16.4,16.9): click(tp,0.3,700); thud(tp,0.12)
ting(17.0,84,0.1); click(17.0,0.35,500)
boop(18.8,84); boop(18.92,91)
for k2 in range(10): click(22.7+k2*0.08+(0.03 if k2%3 else 0),0.06,2600)
# services montage 24-30: a whip + pop on every card
for k2,c in enumerate((24.0,25.3,26.6,27.3,28.0,28.9,29.5)):
    whoosh(c-0.06,0.2,0.16,500,6000); pop(c+0.05,0.18,500+k2*70) if 'pop' in dir() else boop(c+0.05,84+k2*2,0.12)
for k2 in range(4): ting(25.4+k2*0.2,88+k2*3,0.08,0.4)   # sale sticker
for k2 in range(5): ting(29.5+k2*0.1,84+k2*4,0.08,0.4)   # results going up
for k2 in range(6): step(25.0+S+k2*0.35,0.07)
ting(27.0+S,98,0.14)
doorbell(29.8+S,0.25)
for k2 in range(8): step(30.0+S+k2*0.25,0.07)
for k2 in range(6): step(34.0+S+k2*0.3,0.07)
whoosh(37.0+S,1.0,0.4,300,6000)
mix=music*0.95+sfx
mix=mix/max(1.0,np.max(np.abs(mix))/0.9)
st=np.stack([mix,mix],1)
w=wave.open('../public/ugo_musica.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
print('ok', 20*np.log10(np.sqrt(np.mean(mix**2))))

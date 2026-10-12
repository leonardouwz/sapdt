import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt, matplotlib.dates as md
from datetime import date, timedelta
D=date
rows=[ # (etiqueta, inicio, fin_inclusivo, color)
("Idea final entregada (1-sep)",D(2026,9,1),D(2026,9,1),'hito'),
("Semanas 1-4 sin avance formal",D(2026,9,7),D(2026,10,4),'perdido'),
("Datasets, catálogo, roles y diagramas",D(2026,10,5),D(2026,10,11),'recup'),
("Práctica 2 (entregada)",D(2026,10,5),D(2026,10,11),'recup'),
("HITO 1 (11-oct)",D(2026,10,11),D(2026,10,11),'hito'),
("RF-01 Ingesta y consolidación",D(2026,10,12),D(2026,10,18),'s1'),
("RF-02 Cruce geográfico y temporal",D(2026,10,12),D(2026,10,18),'s1'),
("RF-03 Proyección de demanda",D(2026,10,19),D(2026,10,25),'s2'),
("RF-04 Temporada · RF-05 Comparativos",D(2026,10,26),D(2026,11,1),'s2'),
("RF-06 Directorio · RF-07 Series · RF-08 Exportar",D(2026,11,2),D(2026,11,8),'s2'),
("Pruebas, artículo IEEE y diapositivas",D(2026,11,9),D(2026,11,15),'s2'),
("Buffer y ensayo de sustentación",D(2026,11,16),D(2026,11,22),'cierre'),
("HITO 2 (22-nov)",D(2026,11,22),D(2026,11,22),'hito'),
]
col={'perdido':'#C9503C','recup':'#E0A030','s1':'#2F5D8C','s2':'#4C9A6A','cierre':'#7A8A99','hito':'#111111'}
fig,ax=plt.subplots(figsize=(13,6.2),dpi=150)
n=len(rows)
for i,(lab,a,b,c) in enumerate(rows):
    y=n-1-i
    if c=='hito':
        ax.plot(md.date2num(a)+0.5,y,marker='D',color=col[c],ms=11,zorder=3)
    else:
        ax.barh(y,(b-a).days+1,left=md.date2num(a),height=0.55,color=col[c],zorder=2)
ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in rows][::-1],fontsize=9)
ax.xaxis_date(); ax.xaxis.set_major_locator(md.WeekdayLocator(byweekday=md.MO,interval=1))
ax.xaxis.set_major_formatter(md.DateFormatter('%d-%b')); plt.setp(ax.get_xticklabels(),rotation=45,ha='right',fontsize=8)
ax.set_xlim(md.date2num(D(2026,8,31)),md.date2num(D(2026,11,24)))
ax.grid(axis='x',color='#DDDDDD',zorder=0); ax.set_axisbelow(True)
for s in ['top','right']: ax.spines[s].set_visible(False)
# número de semana arriba
ax2=ax.secondary_xaxis('top'); 
wk=[md.date2num(D(2026,9,7)+timedelta(7*k)) for k in range(12)]
ax2.set_xticks([w+3.5 for w in wk]); ax2.set_xticklabels([f"S{k+1}" for k in range(12)],fontsize=8); ax2.tick_params(length=0)
import matplotlib.patches as mp
ax.legend(handles=[mp.Patch(color=col[k],label=l) for k,l in [('perdido','Sin avance formal'),('recup','Recuperación (Sprint 0)'),('s1','Sprint 1: datos'),('s2','Sprint 2: análisis y producto'),('cierre','Cierre')]],loc='lower left',fontsize=8,frameon=False,ncol=1)
ax.set_title('SAPDT — Cronograma (inicio 1-sep-2026, 11 semanas)',fontsize=12,loc='left',pad=24)
plt.tight_layout(); plt.savefig('CS_HITO1_gantt.png'); print('ok')

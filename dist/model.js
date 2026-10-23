// Experimental, deterministic model. Coefficients are illustrative, not estimates.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const policyDefs=[
 {key:'income',name:'Renda básica',icon:'◉',description:'Transferência mensal para toda a população. Reduz a vulnerabilidade e exige financiamento permanente.',label:'Valor mensal por pessoa',min:0,max:800,step:50,unit:'M$',default:0},
 {key:'pension',name:'Previdência pública',icon:'◷',description:'Renda para a população idosa. A cobertura amplia a proteção social e o gasto recorrente.',label:'Cobertura da população idosa',min:0,max:100,step:5,unit:'%',default:65},
 {key:'labor',name:'Proteção trabalhista',icon:'⚒',description:'Direitos, fiscalização e proteção ao emprego. A implementação altera renda e custos de contratação.',label:'Intensidade de proteção',min:0,max:100,step:5,unit:'/100',default:50},
 {key:'tax',name:'Tributação efetiva',icon:'▥',description:'Parcela da produção arrecadada. Financia políticas; alíquotas elevadas também afetam o investimento.',label:'Receita tributária / PIB',min:10,max:50,step:1,unit:'%',default:28},
 {key:'services',name:'Saúde e educação',icon:'✚',description:'Investimento em serviços públicos. Os ganhos em capacidade e produtividade levam tempo para aparecer.',label:'Investimento anual / PIB',min:2,max:18,step:1,unit:'%',default:8},
 {key:'infrastructure',name:'Infraestrutura territorial',icon:'⌁',description:'Estradas, saneamento e conexões. Regiões montanhosas demandam mais recursos para a mesma cobertura.',label:'Investimento anual / PIB',min:0,max:10,step:.5,unit:'%',default:3}
];
export const regionDefs=[
 {name:'Serra Alta',x:312,y:205,share:.1,income:.79,access:.64,terrain:1.35,sector:'Mineração e turismo de montanha',description:'Serras, recursos minerais e cidades dispersas.',color:'#9a9c78',capital:'Pedra Clara'},
 {name:'Campos do Norte',x:535,y:190,share:.14,income:.78,access:.77,terrain:1.05,sector:'Agricultura e energia renovável',description:'Planícies agrícolas e pequenos centros urbanos.',color:'#a6af7a',capital:'Campo Novo'},
 {name:'Costa Verde',x:688,y:314,share:.22,income:1.16,access:.92,terrain:1,sector:'Portos, comércio e serviços',description:'Uma costa conectada às rotas comerciais.',color:'#7f9f7a',capital:'Porto Verde'},
 {name:'Vale Central',x:445,y:352,share:.27,income:1.18,access:.91,terrain:1.05,sector:'Indústria, serviços e administração',description:'O coração produtivo e político do país.',color:'#b0ae73',capital:'Nova Aurora'},
 {name:'Fronteira Oeste',x:268,y:434,share:.09,income:.69,access:.56,terrain:1.25,sector:'Agropecuária e extração florestal',description:'Baixa densidade e grandes distâncias entre serviços.',color:'#8a9b73',capital:'Rio Manso'},
 {name:'Terras do Sul',x:496,y:549,share:.18,income:1.02,access:.82,terrain:1.1,sector:'Agroindústria e tecnologia',description:'Cidades médias entre campos e colinas.',color:'#91a986',capital:'Santa Lúcia'}
];
export function initialState(config={}){
 const population=config.population??24.8;
 const m={population,gdp:population*18.4,poverty:24.6,unemployment:8.7,inflation:4.8,debt:58,welfare:62.4,approval:57};
 return {version:1,name:config.name??'Aurora',government:config.government??'República democrática',economy:config.economy??'Economia mista',external:config.external??'estavel',seed:config.seed??1042,quarter:0,policies:Object.fromEntries(policyDefs.map(p=>[p.key,p.default])),capacity:.65,metrics:m,history:[{quarter:0,...m}],events:[{title:'Seu país está pronto para começar',detail:'Explore o território, ajuste as políticas e avance o primeiro trimestre.'}]};
}
export function budget(s){const p=s.policies,m=s.metrics;const ubi=p.income*12*m.population/(m.gdp*1000)*100;const pension=p.pension*.075;const spending=11+p.services+p.infrastructure+ubi+pension;const interest=m.debt*.055;return {ubi,pension,spending,interest,revenue:p.tax,balance:p.tax-spending-interest};}
export function advance(s){
 if(s.quarter>=160)return s;
 const n=structuredClone(s),p=n.policies,m=n.metrics,b=budget(n),prev={...m};
 n.capacity=clamp(n.capacity+(.0009*(p.services-8))+.0005*(p.infrastructure-3),.35,.95);
 const ext={estavel:0,recessao:-1.6,expansao:1.3,sancoes:-2.4}[n.external]??0;
 const cycle=Math.sin((n.quarter+n.seed%17)*.7)*.22;
 const annualGrowth=clamp(2+.12*(p.infrastructure-3)*n.capacity+.12*(p.services-8)*n.capacity-.045*Math.max(0,p.tax-32)-.025*Math.max(0,p.labor-65)+Math.min(1,b.ubi*.07)+ext+cycle-.03*Math.max(0,m.debt-85),-8,9);
 m.gdp*=1+annualGrowth/400;m.population*=1.002;
 const povertyTarget=clamp(25-1.3*b.ubi*n.capacity-.055*(p.pension-65)-.065*(p.labor-50)-.35*(p.services-8)*n.capacity+.8*(m.unemployment-8.7),2,70);
 m.poverty=clamp(m.poverty+(povertyTarget-m.poverty)*.13,.5,90);
 m.unemployment=clamp(m.unemployment-.085*(annualGrowth-1.5)+.006*Math.max(0,p.labor-70),1.5,35);
 const inflationTarget=clamp(4+.09*Math.max(0,-b.balance-3)+b.ubi*.05-.04*Math.max(0,p.tax-28)+Math.max(0,-ext)*.35,0,30);
 m.inflation=clamp(m.inflation+(inflationTarget-m.inflation)*.16,0,35);
 m.debt=clamp((m.debt-b.balance/4)/(1+annualGrowth/400),0,250);
 const access=regionDefs.reduce((a,r)=>a+r.share*r.access,0);
 const welfareTarget=clamp(58+.8*(p.services-8)*n.capacity+.15*(p.labor-50)+.065*(p.pension-65)+.8*b.ubi*n.capacity+.45*(24.6-m.poverty)+access*4-.7*Math.max(0,m.inflation-6),10,97);
 m.welfare=clamp(m.welfare+(welfareTarget-m.welfare)*.1,0,100);
 m.approval=clamp(52+.7*(m.welfare-60)-.8*(m.unemployment-8)-.7*Math.max(0,m.inflation-5),5,95);
 n.quarter++;n.history.push({quarter:n.quarter,...m});
 n.events=[{title:`Atividade econômica: ${annualGrowth>=0?'+':''}${annualGrowth.toFixed(1).replace('.',',')}% ao ano`,detail:'Taxa anualizada do trimestre; inclui investimento, tributação, contexto externo e ciclo determinístico.'},{title:`Pobreza ${m.poverty<prev.poverty?'recuou':'avançou'} ${Math.abs(m.poverty-prev.poverty).toFixed(2).replace('.',',')} p.p.`,detail:'Transferências e serviços interagem com execução e mercado de trabalho; o ajuste é gradual.'},{title:b.balance<0?'Orçamento em déficit':'Orçamento em superávit',detail:`Saldo anual projetado: ${b.balance.toFixed(1).replace('.',',')}% do PIB, incluindo juros. A dívida absorve o saldo trimestral.`}];
 return n;
}
export function regionalMetrics(s,index){const r=regionDefs[index],m=s.metrics,p=s.policies;const execution=clamp(r.access+(p.infrastructure-3)*.008/(r.terrain),.3,1);return {population:m.population*r.share,income:m.gdp/m.population*1000*r.income,poverty:clamp(m.poverty+(1-r.income)*17-(p.income/800)*(1-r.income)*3,1,90),welfare:clamp(m.welfare+(execution-.8)*24+(r.income-1)*8,0,100),access:execution*100};}

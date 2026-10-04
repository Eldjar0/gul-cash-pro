// ============= Lines 1-500 of 517 total lines =============

1: import { useState, useEffect } from 'react';
2: import { ShoppingBag, CheckCircle2, Thermometer, Calendar, Clock, CreditCard, Banknote } from 'lucide-react';
3: import { supabase } from '@/integrations/supabase/client';
4: logoMarket from '@/assets/logo-market.png';
5: import { PromotionBanner } from '@/components/customer-display/PromotionBanner';
6: import { createSafeBroadcastChannel } from '@/lib/safeBroadcast';
7: 
8: interface DisplayItem {
9:   name: string;
10:   quantity: number;
11:   price: number;
12:   originalPrice: number;
13:   vatRate: number;
14:   total: number;
15:   unit?: string;
16:   discount?: {
17:     type: 'percentage' | 'amount';
18:     value: number;
19:   };
20:   hasCustomPrice?: boolean;
21: }
22: 
23: interface DisplayState {
24:   items: DisplayItem[];
25:   status: 'idle' | 'shopping' | 'completed';
26:   timestamp: number;
27:   cashierName?: string;
28:   saleNumber?: string;
29:   globalDiscount?: {
30:     type: 'percentage' | 'amount';
31:     value: number;
32:   };
33:   promoCode?: {
34:     code: string;
35:     type: 'percentage' | 'amount';
36:     value: number;
37:   };
38:   totals?: {
39:     subtotal: number;
40:     totalVat: number;
41:     totalDiscount: number;
42:     total: number;
43:   };
44:   isInvoice?: boolean;
45:   customer?: {
46:     name: string;
47:   };
48: }
49: 
50: interface DisplaySettings {
51:   welcome_text: string;
52:   thank_you_text: string;
53:   primary_color: string;
54:   secondary_color: string;
55:   text_color: string;
56: }
57: 
58: const CustomerDisplay = () => {
59:   const [displayState, setDisplayState] = useState<DisplayState>({
60:     items: [],
61:     status: 'idle',
62:     timestamp: Date.now(),
63:   });
64: 
65:   const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
66:     welcome_text: 'Bienvenue',
67:     thank_you_text: 'Merci de votre visite !',
68:     primary_color: '#3B82F6',
69:     secondary_color: '#10B981',
70:     text_color: '#1F2937',
71:   });
72: 
73:   const [currentTime, setCurrentTime] = useState(new Date());
74:   const [temperature, setTemperature] = useState<number | null>(null);
75: 
76:   // Mise à jour de l'heure toutes les secondes
77:   useEffect(() => {
78:     const timer = setInterval(() => {
79:       setCurrentTime(new Date());
80:     }, 1000);
81: 
82:     return () => clearInterval(timer);
83:   }, []);
84: 
85:   // Récupération de la température pour Jumet
86:   useEffect(() => {
87:     const fetchTemperature = async () => {
88:       try {
89:         const response = await fetch(
90:           'https://api.open-meteo.com/v1/forecast?latitude=50.4497&longitude=4.4344&current=temperature_2m&timezone=Europe/Brussels'
91:         );
92:         const data = await response.json();
93:         if (data?.current?.temperature_2m !== undefined) {
94:           setTemperature(data.current.temperature_2m);
95:         }
96:       } catch (error) {
97:         console.error('Error fetching temperature:', error);
98:       }
99:     };
100: 
101:     // Récupérer immédiatement
102:     fetchTemperature();
103: 
104:     // Mettre à jour toutes les 10 minutes
105:     const interval = setInterval(fetchTemperature, 10 * 60 * 1000);
106: 
107:     return () => clearInterval(interval);
108:   }, []);
109: 
110:   useEffect(() => {
111:     // Canal de communication
112:     const channel = createSafeBroadcastChannel('customer_display');
113: 
114:     channel.onmessage = (event) => {
115:       console.log('[CustomerDisplay] Message received:', event.data);
116:       // Message de mise à jour des paramètres
117:       if (event.data?.type === 'settings' && event.data?.value) {
118:         setDisplaySettings(event.data.value);
119:         try {
120:           localStorage.setItem('display_settings_cache', JSON.stringify(event.data.value));
121:         } catch {}
122:         return;
123:       }
124:       // Message d'état d'achat
125:       if (event.data?.items) {
126:         setDisplayState(event.data);
127:       }
128:     };
129: 
130:     // Charger paramètres depuis le cache
131:     try {
132:       const cached = localStorage.getItem('display_settings_cache');
133:       if (cached) {
134:         setDisplaySettings(JSON.parse(cached));
135:       }
136:     } catch (e) {
137:       console.error('Error parsing cached settings:', e);
138:     }
139: 
140:     // Charger paramètres depuis Supabase
141:     (async () => {
142:       const { data } = await supabase
143:         .from('settings')
144:         .select('value')
145:         .eq('key', 'display_settings')
146:         .maybeSingle();
147:       if (data?.value) {
148:         const val = data.value as any;
149:         setDisplaySettings({
150:           welcome_text: val.welcome_text ?? 'Bienvenue',
151:           thank_you_text: val.thank_you_text ?? 'Merci de votre visite !',
152:           primary_color: val.primary_color ?? '#3B82F6',
153:           secondary_color: val.secondary_color ?? '#10B981',
154:           text_color: val.text_color ?? '#1F2937',
155:         });
156:         try { localStorage.setItem('display_settings_cache', JSON.stringify(val)); } catch {}
157:       }
158:     })();
159: 
160:     // Charger l'état initial depuis localStorage
161:     const stored = localStorage.getItem('customer_display_state');
162:     if (stored) {
163:       try {
164:         const parsed = JSON.parse(stored);
165:         console.log('[CustomerDisplay] Initial state loaded:', parsed);
166:         setDisplayState(parsed);
167:       } catch (e) {
168:         console.error('Error parsing stored state:', e);
169:       }
170:     }
171: 
172:     // Vérifier périodiquement localStorage pour synchronisation (optimisé)
173:     const interval = setInterval(() => {
174:       const stored = localStorage.getItem('customer_display_state');
175:       if (stored) {
176:         try {
177:           const parsed = JSON.parse(stored);
178:           // Ne déclencher setDisplayState que si le timestamp est vraiment différent
179:           setDisplayState(prev => {
180:             if (parsed.timestamp !== prev.timestamp) {
181:               console.log('[CustomerDisplay] State updated from localStorage:', parsed);
182:               return parsed;
183:             }
184:             return prev;
185:           });
186:         } catch (e) {
187:           console.error('Error parsing stored state:', e);
188:         }
189:       }
190:     }, 500);
191: 
192:     return () => {
193:       channel.close();
194:       clearInterval(interval);
195:     };
196:   }, []);
197: 
198:   const calculateSubtotal = (item: DisplayItem) => {
199:     return (item.price * item.quantity) / (1 + item.vatRate / 100);
200:   };
201: 
202:   const calculateVAT = (item: DisplayItem) => {
203:     const subtotal = calculateSubtotal(item);
204:     return subtotal * (item.vatRate / 100);
205:   };
206: 
207:   const getTotalHT = () => {
208:     return displayState.items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
209:   };
210: 
211:   const getTotalVAT = () => {
212:     return displayState.items.reduce((sum, item) => sum + calculateVAT(item), 0);
213:   };
214: 
215:   const getTotalTTC = () => {
216:     return displayState.items.reduce((sum, item) => sum + item.total, 0);
217:   };
218: 
219:   if (displayState.status === 'idle') {
220:     return (
221:       <div className="h-screen bg-pos-display text-pos-display-foreground flex items-center justify-center p-4 relative overflow-hidden">
222:         {/* Animation de bulles flottantes en arrière-plan */}
223:         <div className="absolute inset-0 overflow-hidden pointer-events-none">
224:           {/* Bulles flottantes */}
225:           <div className="absolute top-20 left-10 w-32 h-32 bg-category-blue/20 rounded-full blur-2xl animate-float" style={{ animationDuration: '6s', animationDelay: '0s' }}></div>
226:           <div className="absolute top-40 right-20 w-40 h-40 bg-category-teal/20 rounded-full blur-2xl animate-float" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
227:           <div className="absolute bottom-32 left-1/4 w-36 h-36 bg-category-purple/20 rounded-full blur-2xl animate-float" style={{ animationDuration: '7s', animationDelay: '2s' }}></div>
228:           <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-category-blue/20 rounded-full blur-2xl animate-float" style={{ animationDuration: '9s', animationDelay: '3s' }}></div>
229:           <div className="absolute bottom-20 right-10 w-44 h-44 bg-category-teal/20 rounded-full blur-2xl animate-float" style={{ animationDuration: '10s', animationDelay: '1.5s' }}></div>
230:           <div className="absolute top-1/2 left-16 w-24 h-24 bg-category-pink/20 rounded-full blur-2xl animate-float" style={{ animationDuration: '8.5s', animationDelay: '2.5s' }}></div>
231:           <div className="absolute bottom-1/4 right-1/4 w-38 h-38 bg-category-blue/20 rounded-full blur-2xl animate-float" style={{ animationDuration: '7.5s', animationDelay: '0.5s' }}></div>
232:           <div className="absolute top-1/4 left-1/2 w-30 h-30 bg-category-teal/15 rounded-full blur-xl animate-float" style={{ animationDuration: '6.5s', animationDelay: '3.5s' }}></div>
233:           
234:           {/* Grands cercles style DVD bouncing */}
235:           <div className="absolute w-32 h-32 bg-category-blue/40 rounded-full blur-xl animate-dvd-bounce" style={{ animationDuration: '12s' }}></div>
236:           <div className="absolute w-40 h-40 bg-category-teal/40 rounded-full blur-xl animate-dvd-bounce-2" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
237:           <div className="absolute w-36 h-36 bg-category-purple/40 rounded-full blur-xl animate-dvd-bounce-3" style={{ animationDuration: '18s', animationDelay: '4s' }}></div>
238:         </div>
239:         
240:         <div className="w-full max-w-6xl space-y-4 relative z-10">
241:           {/* Logo centré */}
242:           <div className="text-center animate-fade-in">
243:             <div className="relative inline-block">
244:               <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse-soft opacity-60"></div>
245:               <img src={logoMarket} alt="Logo" className="relative w-56 h-56 mx-auto object-contain animate-scale-in drop-shadow-2xl brightness-110" />
246:             </div>
247:             
248:             <div className="mt-6 relative">
249:               <div className="absolute inset-0 bg-white/20 blur-2xl opacity-40 animate-pulse-soft"></div>
250:               <h1 className="relative text-8xl font-black tracking-tight animate-scale-in drop-shadow-2xl text-white" style={{ animationDelay: '0.1s', lineHeight: '1' }}>
251:                 Bienvenue
252:               </h1>
253:             </div>
254:           </div>
255: 
256:           {/* Textes centrés entre logo et infos */}
257:           <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
258:             <p className="text-3xl font-black text-white drop-shadow-lg">
259:               Veuillez patienter
260:             </p>
261:             <p className="text-2xl font-bold text-white/80">
262:               Un collaborateur va prendre votre commande
263:             </p>
264:           </div>
265: 
266:           {/* Promotion Banner */}
267:           <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
268:             <PromotionBanner />
269:           </div>
270: 
271:           {/* Section infos (date, heure, température) - carrousel infini */}
272:           <div className="relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.4s' }}>
273:             <div className="flex gap-4 animate-scroll-left">
274:               {/* Premier set de cartes */}
275:               {/* Date */}
276:               <div className="flex-shrink-0 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/15 shadow-lg">
277:                 <div className="flex items-center gap-2 mb-2">
278:                   <div className="p-2 bg-white/10 rounded-lg">
279:                     <Calendar className="h-5 w-5 text-category-blue" />
280:                   </div>
281:                   <p className="text-sm font-bold text-category-blue uppercase tracking-wide">Date</p>
282:                 </div>
283:                 <p className="text-base font-bold text-white leading-tight">
284:                   {currentTime.toLocaleDateString('fr-BE', { 
285:                     weekday: 'long', 
286:                     day: '2-digit', 
287:                     month: 'long', 
288:                     year: 'numeric' 
289:                   })}
290:                 </p>
291:               </div>
292: 
293:               {/* Heure */}
294:               <div className="flex-shrink-0 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/15 shadow-lg">
295:                 <div className="flex items-center gap-2 mb-2">
296:                   <div className="p-2 bg-white/10 rounded-lg">
297:                     <Clock className="h-5 w-5 text-category-teal" />
298:                   </div>
299:                   <p className="text-sm font-bold text-category-teal uppercase tracking-wide">Heure</p>
300:                 </div>
301:                 <p className="text-3xl font-black text-white font-mono tabular-nums">
302:                   {currentTime.toLocaleTimeString('fr-BE', { 
303:                     hour: '2-digit', 
304:                     minute: '2-digit',
305:                     second: '2-digit'
306:                   })}
307:                 </p>
308:               </div>
309: 
310:               {/* Température */}
311:               <div className="flex-shrink-0 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/15 shadow-lg">
312:                 <div className="flex items-center gap-2 mb-2">
313:                   <div className="p-2 bg-white/10 rounded-lg">
314:                     <Thermometer className="h-5 w-5 text-category-yellow" />
315:                   </div>
316:                   <p className="text-sm font-bold text-category-yellow uppercase tracking-wide">Jumet</p>
317:                 </div>
318:                 <p className="text-3xl font-black text-white tabular-nums">
319:                   {temperature !== null ? `${temperature.toFixed(1)}°C` : 'N/A'}
320:                 </p>
321:               </div>
322: 
323:               {/* Deuxième set de cartes (copie pour effet infini) */}
324:               {/* Date */}
325:               <div className="flex-shrink-0 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/15 shadow-lg">
326:                 <div className="flex items-center gap-2 mb-2">
327:                   <div className="p-2 bg-white/10 rounded-lg">
328:                     <Calendar className="h-5 w-5 text-category-blue" />
329:                   </div>
330:                   <p className="text-sm font-bold text-category-blue uppercase tracking-wide">Date</p>
331:                 </div>
332:                 <p className="text-base font-bold text-white leading-tight">
333:                   {currentTime.toLocaleDateString('fr-BE', { 
334:                     weekday: 'long', 
335:                     day: '2-digit', 
336:                     month: 'long', 
337:                     year: 'numeric' 
338:                   })}
339:                 </p>
340:               </div>
341: 
342:               {/* Heure */}
343:               <div className="flex-shrink-0 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/15 shadow-lg">
344:                 <div className="flex items-center gap-2 mb-2">
345:                   <div className="p-2 bg-white/10 rounded-lg">
346:                     <Clock className="h-5 w-5 text-category-teal" />
347:                   </div>
348:                   <p className="text-sm font-bold text-category-teal uppercase tracking-wide">Heure</p>
349:                 </div>
350:                 <p className="text-3xl font-black text-white font-mono tabular-nums">
351:                   {currentTime.toLocaleTimeString('fr-BE', { 
352:                     hour: '2-digit', 
353:                     minute: '2-digit',
354:                     second: '2-digit'
355:                   })}
356:                 </p>
357:               </div>
358: 
359:               {/* Température */}
360:               <div className="flex-shrink-0 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/15 shadow-lg">
361:                 <div className="flex items-center gap-2 mb-2">
362:                   <div className="p-2 bg-white/10 rounded-lg">
363:                     <Thermometer className="h-5 w-5 text-category-yellow" />
364:                   </div>
365:                   <p className="text-sm font-bold text-category-yellow uppercase tracking-wide">Jumet</p>
366:                 </div>
367:                 <p className="text-3xl font-black text-white tabular-nums">
368:                   {temperature !== null ? `${temperature.toFixed(1)}°C` : 'N/A'}
369:                 </p>
370:               </div>
371:             </div>
372:           </div>
373: 
374:           {/* Footer */}
375:           <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
376:             <div className="px-8 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 shadow-lg">
377:               <p className="text-base text-white/75 font-medium">
378:                 Système de caisse développé par <span className="text-white font-bold">Jlprod.be</span>
379:               </p>
380:             </div>
379:             </div>
380:           </div>
381:         </div>
382:       </div>
383:     );
384:   }
385: 
386:   if (displayState.status === 'completed') {
387:     return (
388:       <div className="min-h-screen bg-pos-display text-pos-display-foreground flex items-center justify-center p-8">
389:         <div className="text-center space-y-12 animate-bounce-in">
390:           <div className="relative">
391:             <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse-soft"></div>
392:             <img src={logoMarket} alt="Logo" className="relative w-80 h-80 mx-auto object-contain drop-shadow-2xl" />
393:           </div>
394:           <div className="relative">
395:             <div className="absolute inset-0 bg-category-green/20 blur-2xl rounded-full"></div>
396:             <CheckCircle2 className="relative w-48 h-48 mx-auto text-category-green animate-bounce-in drop-shadow-2xl" style={{ animationDelay: '0.2s' }} />
397:           </div>
398:           <div className="space-y-8">
399:             <h1 className="text-9xl font-black animate-fade-in text-white tracking-tight" style={{ animationDelay: '0.3s' }}>
400:               Merci !
401:             </h1>
402:             <p className="text-6xl animate-fade-in text-white/90 font-bold" style={{ animationDelay: '0.5s' }}>
403:               À bientôt !
404:             </p>
405:             <div className="inline-block px-8 py-4 bg-white/10 rounded-full border-2 border-white/30 shadow-glow-lg animate-fade-in" style={{ animationDelay: '0.7s' }}>
406:               <p className="text-2xl text-white font-bold">Passez une excellente journée !</p>
407:             </div>
408:           </div>
409:         </div>
410:       </div>
411:     );
412:   }
413: 
414:   return (
415:     <div className="min-h-screen bg-pos-display text-pos-display-foreground flex flex-col overflow-hidden">
416:       {/* Header fixe avec logo */}
417:       <div className="fixed top-0 left-0 right-0 bg-pos-display backdrop-blur-md border-b-2 border-white/10 shadow-xl p-3 z-10">
418:         <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
419:           <div className="relative">
420:             <img src={logoMarket} alt="Logo" className="h-14 object-contain drop-shadow-lg" />
421:           </div>
422:           <div className="text-center flex-1">
423:             <div className="inline-block px-4 py-1.5 bg-white/15 rounded-full border border-white/30 backdrop-blur-sm">
424:               <h1 className="text-2xl font-black text-white tracking-tight">
425:                 {displayState.isInvoice ? 'FACTURE' : 'TICKET'} {displayState.saleNumber || 'EN COURS'}
426:               </h1>
427:             </div>
428:             {displayState.isInvoice && displayState.customer && (
429:               <p className="text-lg text-white font-bold mt-1">{displayState.customer.name}</p>
430:             )}
431:           </div>
432:           <div className="text-right bg-white/15 rounded-lg px-3 py-2 border border-white/30 backdrop-blur-sm">
433:             <p className="text-xs text-white/85 uppercase tracking-wide font-bold">Caisse</p>
434:             <p className="text-lg font-black text-white">{displayState.cashierName || 'N/A'}</p>
435:           </div>
436:         </div>
437:       </div>
438: 
439:       {/* Zone scrollable pour les articles - avec padding top et bottom pour header/footer fixes */}
440:       <div className="flex-1 overflow-y-auto pt-24 pb-32 px-6">
441:         <div className="max-w-7xl mx-auto space-y-4">
442:           {displayState.items.slice(-2).map((item, index) => {
443:             const subtotal = calculateSubtotal(item);
444:             const vat = calculateVAT(item);
445:             const unitDisplay = item.unit === 'kg' ? 'kg' : item.unit === 'l' ? 'l' : 'pc';
446:             
447:             return (
448:               <div
449:                 key={`${item.name}-${index}`}
450:                 className="bg-card text-card-foreground rounded-3xl shadow-2xl p-8 border-4 border-primary/30 hover:shadow-glow-lg hover:border-primary/60 transition-all duration-300 hover:scale-[1.01] animate-fade-in"
451:                 style={{ animationDelay: `${index * 0.05}s` }}
452:               >
453:                 <div className="flex justify-between items-start gap-8">
454:                   <div className="flex-1">
455:                     <h3 className="text-4xl font-black text-card-foreground uppercase tracking-tight mb-4 flex items-center gap-4">
456:                       <div className="w-3 h-10 bg-primary rounded-full shadow-lg"></div>
457:                       {item.name}
458:                     </h3>
459:                     <div className="flex gap-4 items-center flex-wrap">
460:                       <div className="flex items-center gap-4 bg-primary/10 rounded-2xl px-6 py-3 border-2 border-primary/20">
461:                         <span className="text-3xl font-black text-card-foreground">
462:                           {item.quantity.toFixed(item.unit === 'kg' ? 3 : 0)} {unitDisplay}
463:                         </span>
464:                         <span className="text-2xl text-muted-foreground font-bold">×</span>
465:                         <span className="text-3xl font-black text-primary">
466:                           {item.price.toFixed(2)} €
467:                         </span>
468:                       </div>
469:                       {item.hasCustomPrice && (
470:                         <span className="px-6 py-3 rounded-2xl text-lg font-black bg-category-teal/15 text-category-teal border-2 border-category-teal/40 shadow-lg">
471:                           Prix modifié
472:                         </span>
473:                       )}
474:                       {item.discount && (
475:                         <span className="px-6 py-3 rounded-2xl text-lg font-black bg-destructive/20 text-destructive border-2 border-destructive/50 shadow-lg">
476:                           -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
477:                         </span>
478:                       )}
479:                     </div>
480:                   </div>
481:                   <div className="text-right">
482:                     <div className="bg-primary/15 rounded-3xl px-8 py-6 border-4 border-primary/40 shadow-glow-lg">
483:                       <div className="text-6xl font-black text-primary mb-2 tabular-nums drop-shadow-lg">
484:                         {item.total.toFixed(2)} €
485:                       </div>
486:                       <div className="text-base text-muted-foreground font-bold">
487:                         TVA {item.vatRate}%: <span className="text-card-foreground font-black text-lg">{vat.toFixed(2)}€</span>
488:                       </div>
489:                     </div>
490:                   </div>
491:                 </div>
492:               </div>
493:             );
494:           })}
495:         </div>
496:       </div>
497: 
498:       {/* Footer fixe avec total en bas */}
499:       <div className="fixed bottom-0 left-0 right-0 bg-pos-display shadow-xl z-10 border-t-2 border-white/10">
500:         <div className="max-w-7xl mx-auto p-4">
501:           <div className="flex justify-center items-center">
502:             {/* Total TTC centré */}
503:             <div className="bg-white/15 backdrop-blur-md rounded-2xl px-8 py-4 border-2 border-white/30 shadow-lg">
504:               <div className="text-xl font-black text-white mb-2 uppercase tracking-wide">TOTAL À PAYER</div>
505:               <div className="text-5xl font-black text-white tracking-tight leading-none tabular-nums">
506:                 {getTotalTTC().toFixed(2)} €
507:               </div>
508:             </div>
509:           </div>
510:         </div>
511:       </div>
512:     </div>
513:   );
514: };
515: 
516: export default CustomerDisplay;

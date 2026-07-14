function t(t,e,i,s){var n,r=arguments.length,a=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,s);else for(var o=t.length-1;o>=0;o--)(n=t[o])&&(a=(r<3?n(a):r>3?n(e,i,a):n(e,i))||a);return r>3&&a&&Object.defineProperty(e,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)},o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:d,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,g=globalThis,b=g.trustedTypes,v=b?b.emptyScript:"",_=g.reactiveElementPolyfillSupport,m=(t,e)=>t,f={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!d(t,e),x={attribute:!0,type:String,converter:f,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=x){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);n?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??x}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:f).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:f;this._$Em=s;const r=n.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const r=this.constructor;if(!1===s&&(n=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??y)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==n||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[m("elementProperties")]=new Map,$[m("finalized")]=new Map,_?.({ReactiveElement:$}),(g.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,E=w.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,A="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+C,z=`<${M}>`,P=document,j=()=>P.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,U="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,H=/>/g,D=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,I=/"/g,B=/^(?:script|style|textarea|title)$/i,q=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),X=Symbol.for("lit-nothing"),K=new WeakMap,V=P.createTreeWalker(P,129);function F(t,e){if(!T(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Y=(t,e)=>{const i=t.length-1,s=[];let n,r=2===e?"<svg>":3===e?"<math>":"",a=N;for(let e=0;e<i;e++){const i=t[e];let o,d,l=-1,c=0;for(;c<i.length&&(a.lastIndex=c,d=a.exec(i),null!==d);)c=a.lastIndex,a===N?"!--"===d[1]?a=R:void 0!==d[1]?a=H:void 0!==d[2]?(B.test(d[2])&&(n=RegExp("</"+d[2],"g")),a=D):void 0!==d[3]&&(a=D):a===D?">"===d[0]?(a=n??N,l=-1):void 0===d[1]?l=-2:(l=a.lastIndex-d[2].length,o=d[1],a=void 0===d[3]?D:'"'===d[3]?I:L):a===I||a===L?a=D:a===R||a===H?a=N:(a=D,n=void 0);const h=a===D&&t[e+1].startsWith("/>")?" ":"";r+=a===N?i+z:l>=0?(s.push(o),i.slice(0,l)+A+i.slice(l)+C+h):i+C+(-2===l?e:h)}return[F(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class J{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,r=0;const a=t.length-1,o=this.parts,[d,l]=Y(t,e);if(this.el=J.createElement(d,i),V.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=V.nextNode())&&o.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(A)){const e=l[r++],i=s.getAttribute(t).split(C),a=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:a[2],strings:i,ctor:"."===a[1]?et:"?"===a[1]?it:"@"===a[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(C)&&(o.push({type:6,index:n}),s.removeAttribute(t));if(B.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],j()),V.nextNode(),o.push({type:2,index:++n});s.append(t[e],j())}}}else if(8===s.nodeType)if(s.data===M)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)o.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function Z(t,e,i=t,s){if(e===W)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const r=O(e)?void 0:e._$litDirective$;return n?.constructor!==r&&(n?._$AO?.(!1),void 0===r?n=void 0:(n=new r(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Z(t,n._$AS(t,e.values),n,s)),e}class G{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);V.currentNode=s;let n=V.nextNode(),r=0,a=0,o=i[0];for(;void 0!==o;){if(r===o.index){let e;2===o.type?e=new Q(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new nt(n,this,t)),this._$AV.push(e),o=i[++a]}r!==o?.index&&(n=V.nextNode(),r++)}return V.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=X,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Z(this,t,e),O(t)?t===X||null==t||""===t?(this._$AH!==X&&this._$AR(),this._$AH=X):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>T(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==X&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(F(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new G(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new J(t)),e}k(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new Q(this.O(j()),this.O(j()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=X,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=X}_$AI(t,e=this,i,s){const n=this.strings;let r=!1;if(void 0===n)t=Z(this,t,e,0),r=!O(t)||t!==this._$AH&&t!==W,r&&(this._$AH=t);else{const s=t;let a,o;for(t=n[0],a=0;a<n.length-1;a++)o=Z(this,s[i+a],e,a),o===W&&(o=this._$AH[a]),r||=!O(o)||o!==this._$AH[a],o===X?t=X:t!==X&&(t+=(o??"")+n[a+1]),this._$AH[a]=o}r&&!s&&this.j(t)}j(t){t===X?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===X?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==X)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Z(this,t,e,0)??X)===W)return;const i=this._$AH,s=t===X&&i!==X||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==X&&(i===X||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}}const rt=w.litHtmlPolyfillSupport;rt?.(J,Q),(w.litHtmlVersions??=[]).push("3.3.3");const at=globalThis;class ot extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new Q(e.insertBefore(j(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ot._$litElement$=!0,ot.finalized=!0,at.litElementHydrateSupport?.({LitElement:ot});const dt=at.litElementPolyfillSupport;dt?.({LitElement:ot}),(at.litElementVersions??=[]).push("4.2.2");const lt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ct={attribute:!0,type:String,converter:f,reflect:!1,hasChanged:y},ht=(t=ct,e,i)=>{const{kind:s,metadata:n}=i;let r=globalThis.litPropertyMetadata.get(n);if(void 0===r&&globalThis.litPropertyMetadata.set(n,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?ht(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}const gt=24,bt=.25,vt="daily_schedule",_t=[{key:"sunrise",label:"Sunrise",attr:"next_rising",icon:"mdi:weather-sunset-up"},{key:"sunset",label:"Sunset",attr:"next_setting",icon:"mdi:weather-sunset-down"},{key:"dawn",label:"Dawn",attr:"next_dawn",icon:"mdi:weather-sunny-alert"},{key:"dusk",label:"Dusk",attr:"next_dusk",icon:"mdi:weather-night"}],mt=[{v:0,label:"None"},{v:5/60,label:"±5m"},{v:10/60,label:"±10m"},{v:.25,label:"±15m"},{v:.5,label:"±30m"}],ft={light:"#f5b301",blind:"#7e9cff",water:"#2bc4d4",fan:"#5ad19a",switch:"#a78bfa",climate:"#ff7a66",media:"#e879c9",trigger:"#cfe84a"},yt={light:["light"],blind:["cover"],water:["switch","valve"],fan:["fan"],switch:["switch","input_boolean"],climate:["climate"],media:["media_player"]},xt={heat:"#ff6b5a",cool:"#4aa8ff",heat_cool:"#5ad19a",auto:"#5ad19a",dry:"#f5b301",fan_only:"#7e9cff"};function $t(t){return ft[t]??"var(--primary-color)"}function wt(t){const e=Math.round(60*t);return`${String(Math.floor(e/60)%24).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`}function kt(t){const e=/^(\d{1,2}):(\d{2})$/.exec(t.trim());if(!e)return null;const i=+e[1],s=+e[2];return i>24||s>59?null:Math.min(24,i+s/60)}function Et(t){const e=Math.round(t/bt)*bt;return Math.max(0,Math.min(gt,Math.round(1e4*e)/1e4))}function St(t,e,i){const s=t[e]?.states;if(!s)return 0!==i;const n=s[i]?.key;return void 0!==n&&"off"!==n}function At(t,e,i){return t[e]?.states?.[i]?.label??String(i)}const Ct={heat_cool:"Auto",fan_only:"Fan only"};function Mt(t){return Ct[t]??t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}function zt(t,e,i){if(i.options)return i.options;const s=i.options_attribute;if(!s||!t)return[];const n=e.map(e=>t.states?.[e]?.attributes?.[s]).filter(t=>Array.isArray(t));if(!n.length)return[];let r=n[0];for(const t of n.slice(1))r=r.filter(e=>t.includes(e));const a=new Set(i.exclude??[]);return r.filter(t=>!a.has(t)).map(t=>({value:t,label:Mt(t)}))}function Pt(t,e,i){const s=i.data?.hvac_mode;return"string"==typeof s&&xt[s]?xt[s]:function(t,e,i){return t[e]?.states?.[i]?.color??$t(e)}(t,e,i.state)}function jt(t,e){return t[e]?.param_schema??[]}function Ot(t){return t.keys??[t.key]}function Tt(t,e,i,s,n){const r=s.data?.[n.key];if(void 0!==r)return r;const a=t[e]?.states?.[i]?.data?.[n.key];return void 0!==a?a:n.default}function Ut(t){return(mt.find(e=>Math.abs(e.v-t)<.001)??mt[0]).label}function Nt(t){return _t.find(e=>e.key===t)}function Rt(t){const e=Math.round(60*t);if(0===e)return"±0";const i=Math.abs(e),s=Math.floor(i/60),n=i%60;return`${e<0?"−":"+"}${s?`${s}h${n?` ${n}m`:""}`:`${n}m`}`}function Ht(t,e,i){if(!i)return e;const s=function(t,e){const i=Nt(e),s=i&&t?.states?.["sun.sun"]?.attributes?.[i.attr];if("string"!=typeof s)return null;const n=new Date(s);return isNaN(n.getTime())?null:n.getHours()+n.getMinutes()/60+n.getSeconds()/3600}(t,i.event);return null==s?e:Math.max(0,Math.min(gt,s+i.offset))}function Dt(t,e){const i="start"===e?t.start_expr:t.end_expr;if(!i)return wt("start"===e?t.start:t.end);const s=Nt(i.event);return`${s?.label??i.event}${i.offset?` ${Rt(i.offset)}`:""}`}function Lt(t){return[...t.segments].sort((t,e)=>t.start-e.start)}function It(t){return[...t.triggers??[]].sort((t,e)=>t.at-e.at)}function Bt(t){const e=[0,...It(t).map(t=>t.at),gt];let i=0,s=12;for(let t=0;t<e.length-1;t++){const n=e[t+1]-e[t];n>i&&(i=n,s=(e[t]+e[t+1])/2)}return Et(s)}function qt(t,e){const i=t.segments.filter(t=>t.id!==e.id),s=i.filter(t=>t.end<=e.start).reduce((t,e)=>Math.max(t,e.end),0),n=i.filter(t=>t.start>=e.end).reduce((t,e)=>Math.min(t,e.start),gt);return{min:s,max:n}}const Wt=a`
  :host {
    --ds-track-bg: var(--secondary-background-color, #0d1116);
    --ds-panel: var(--card-background-color, #1a2029);
    --ds-panel-hi: var(--secondary-background-color, #222b36);
    --ds-line: var(--divider-color, #2c3644);
    --ds-text: var(--primary-text-color, #e8edf2);
    --ds-dim: var(--secondary-text-color, #8a97a6);
    --ds-accent: var(--primary-color, #03a9f4);
    --ds-warn: var(--warning-color, #f5934e);
    --ds-now: var(--error-color, #ff5a6e);
    --ds-sun: #f5b301;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
  }
  .btn.primary {
    background: var(--ds-accent);
    color: var(--text-primary-color, #fff);
    flex: 1;
  }
  .btn.ghost {
    background: transparent;
    border: 1px solid var(--ds-line);
    color: var(--ds-dim);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 6px;
  }

  .popover {
    position: absolute;
    z-index: 20;
    top: 50px;
    left: 0;
    right: 0;
    margin: 0 auto;
    background: var(--ds-panel-hi);
    border-radius: 12px;
    border: 1px solid var(--ds-line);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
    padding: 14px;
    color: var(--ds-text);
  }
  .popover-head {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  .popover-head span {
    font-size: 12.5px;
    font-weight: 700;
  }
  .popover-head button {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--ds-dim);
    cursor: pointer;
    padding: 2px;
    display: inline-flex;
  }
  .field-label {
    font-size: 11px;
    color: var(--ds-dim);
    margin-bottom: 4px;
  }
  .state-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .state-buttons button {
    padding: 6px 11px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid var(--ds-line);
    background: transparent;
    color: var(--ds-dim);
    font-family: inherit;
  }
  .state-buttons button.sel {
    border-color: var(--accent, var(--ds-accent));
    background: color-mix(in srgb, var(--accent, var(--ds-accent)) 18%, transparent);
    color: var(--ds-text);
  }
  input.time {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 9px;
    border-radius: 8px;
    border: 1px solid var(--ds-line);
    background: var(--ds-track-bg);
    color: var(--ds-text);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    font-family: inherit;
  }
`;let Xt=class extends ot{constructor(){super(...arguments),this._name="",this._targets=[],this._save=()=>{this.dispatchEvent(new CustomEvent("bar-settings-save",{detail:{name:this._name.trim()||this.bar.name,targets:this._targets}}))}}willUpdate(t){t.has("bar")&&(this._name=this.bar.name,this._targets=[...this.bar.targets])}render(){const t=yt[this.bar.type]??[],e={entity:{multiple:!0,filter:{domain:t}}};return q`
      <div class="popover" @click=${t=>t.stopPropagation()}>
        <div class="popover-head">
          <span>Bar settings</span>
          <button @click=${()=>this.dispatchEvent(new CustomEvent("popover-close"))}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="block">
          <div class="field-label">Name</div>
          <ha-textfield
            .value=${this._name}
            @input=${t=>this._name=t.target.value}
          ></ha-textfield>
        </div>

        ${t.length?q`<div class="block">
              <div class="field-label">Target entities</div>
              <ha-selector
                .hass=${this.hass}
                .selector=${e}
                .value=${this._targets}
                @value-changed=${t=>this._targets=t.detail.value}
              ></ha-selector>
            </div>`:X}

        <div style="display:flex;gap:8px">
          <button class="btn primary" @click=${this._save}>
            <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon> Save
          </button>
        </div>
      </div>
    `}};Xt.styles=[Wt,a`
      .popover {
        width: 300px;
      }
      .block {
        margin-bottom: 12px;
      }
      ha-textfield {
        width: 100%;
      }
    `],t([pt({attribute:!1})],Xt.prototype,"hass",void 0),t([pt({attribute:!1})],Xt.prototype,"bar",void 0),t([ut()],Xt.prototype,"_name",void 0),t([ut()],Xt.prototype,"_targets",void 0),Xt=t([lt("ds-bar-settings")],Xt);let Kt=class extends ot{constructor(){super(...arguments),this.actions=[],this.accent="",this._actionKey="",this._entity="",this._at="",this._jit=0,this._err="",this._close=()=>this.dispatchEvent(new CustomEvent("popover-close")),this._delete=()=>this.dispatchEvent(new CustomEvent("trigger-delete",{detail:this.trigger.id}))}willUpdate(t){if(t.has("trigger")){const t=this.trigger.action?.service,e=this.actions.find(e=>e.service===t);this._actionKey=e?.key??this.actions[0]?.key??"",this._entity=this.trigger.action?.entity_id??"",this._at=wt(this.trigger.at),this._jit=this.trigger.jitter??0,this._err=""}}get _action(){return this.actions.find(t=>t.key===this._actionKey)}_pickAction(t){t!==this._actionKey&&(this._actionKey=t,this._entity="")}_save(){const t=kt(this._at);return null==t?this._fail("Use HH:MM"):this._action?this._entity?void this.dispatchEvent(new CustomEvent("trigger-save",{detail:{...this.trigger,at:t,jitter:this._jit,action:{service:this._action.service,entity_id:this._entity}}})):this._fail(`Pick a ${this._action.label.toLowerCase()}`):this._fail("Pick an action")}_fail(t){this._err=t}render(){const t={entity:{filter:{domain:this._action?.domain??"scene"}}};return q`
      <div class="popover" style="width:288px" @click=${t=>t.stopPropagation()}>
        <div class="popover-head">
          <span>Edit trigger</span>
          <button @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
        </div>

        <div class="field-label">Run</div>
        <div class="state-buttons" style=${`--accent:${this.accent}`}>
          ${this.actions.map(t=>q`
              <button
                class=${t.key===this._actionKey?"sel":""}
                @click=${()=>this._pickAction(t.key)}
              >
                ${t.label}
              </button>
            `)}
        </div>

        <div class="block">
          <div class="field-label">${this._action?.label??"Entity"}</div>
          <ha-selector
            .hass=${this.hass}
            .selector=${t}
            .value=${this._entity}
            @value-changed=${t=>{this._entity=t.detail.value,this._err=""}}
          ></ha-selector>
        </div>

        <div class="block time-row">
          <div>
            <div class="field-label">Fire at</div>
            <input
              class="time"
              .value=${this._at}
              @input=${t=>{this._at=t.target.value,this._err=""}}
            />
          </div>
        </div>
        ${this._err?q`<div class="hint" style="color:var(--ds-warn)">${this._err}</div>`:X}

        <div class="block">
          <div class="field-label">
            <ha-icon icon="mdi:dice-5" style="--mdc-icon-size:13px"></ha-icon> Daily jitter
          </div>
          <div class="jitter" style=${`--accent:${this.accent}`}>
            ${mt.map(t=>q`
                <button
                  class=${Math.abs(this._jit-t.v)<.001?"sel":""}
                  @click=${()=>this._jit=t.v}
                >
                  ${t.label}
                </button>
              `)}
          </div>
        </div>

        <div class="actions">
          <button class="btn ghost" @click=${this._delete}>
            <ha-icon icon="mdi:trash-can-outline" style="--mdc-icon-size:15px"></ha-icon> Delete
          </button>
          <button class="btn primary" @click=${this._save}>
            <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon> Save
          </button>
        </div>
      </div>
    `}};Kt.styles=[Wt,a`
      .block {
        margin: 12px 0 0;
      }
      .time-row {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }
      .time-row > div {
        flex: 1;
      }
      .jitter {
        display: flex;
        gap: 5px;
        margin-top: 6px;
      }
      .jitter button {
        flex: 1;
        padding: 6px 0;
        border-radius: 7px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid var(--ds-line);
        background: transparent;
        color: var(--ds-dim);
        font-family: inherit;
      }
      .jitter button.sel {
        border-color: var(--accent, var(--ds-accent));
        background: color-mix(in srgb, var(--accent, var(--ds-accent)) 18%, transparent);
        color: var(--ds-text);
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
      .hint {
        font-size: 10.5px;
        margin-top: 6px;
      }
    `],t([pt({attribute:!1})],Kt.prototype,"hass",void 0),t([pt({attribute:!1})],Kt.prototype,"trigger",void 0),t([pt({attribute:!1})],Kt.prototype,"actions",void 0),t([pt()],Kt.prototype,"accent",void 0),t([ut()],Kt.prototype,"_actionKey",void 0),t([ut()],Kt.prototype,"_entity",void 0),t([ut()],Kt.prototype,"_at",void 0),t([ut()],Kt.prototype,"_jit",void 0),t([ut()],Kt.prototype,"_err",void 0),Kt=t([lt("ds-trigger-editor")],Kt);let Vt=class extends ot{constructor(){super(...arguments),this.scheduleOn=!0,this.conflicts=[],this.now=0,this.syncing=!1,this.reordering=!1,this._editing=null,this._drag=null,this._moved=!1,this._reorderDown=t=>{t.preventDefault(),t.stopPropagation(),this.dispatchEvent(new CustomEvent("bar-reorder-start",{detail:{id:this.bar.id,clientY:t.clientY},bubbles:!0,composed:!0}))},this._addSegment=()=>{const t=function(t){const e=t.segments.map(t=>[t.start,t.end]).sort((t,e)=>t[0]-e[0]);let i=null,s=0;const n=t=>t?t[1]-t[0]:0;for(const[t,r]of e)t-s>n(i)&&(i=[s,t]),s=Math.max(s,r);if(gt-s>n(i)&&(i=[s,gt]),!i||n(i)<.5)return null;const r=i[0];return{start:r,end:Math.min(i[1],r+Math.max(1,n(i)/2))}}(this.bar);if(!t)return;const e=0===this.bar.base?1:0,i={id:`seg_${Math.random().toString(36).slice(2,10)}`,start:t.start,end:t.end,state:e,jitter:0};this._emit({...this.bar,segments:[...this.bar.segments,i]},!0),this._editing=i.id},this._saveSegment=t=>{const e=t.detail;this._emit({...this.bar,segments:this.bar.segments.map(t=>t.id===e.id?e:t)},!0),this._editing=null},this._deleteSegment=t=>{this._emit({...this.bar,segments:this.bar.segments.filter(e=>e.id!==t.detail)},!0),this._editing=null},this._pickBase=t=>{this._emit({...this.bar,base:t.detail},!0),this._editing=null},this._saveSettings=t=>{this._emit({...this.bar,name:t.detail.name,targets:t.detail.targets},!0),this._editing=null},this._addTrigger=()=>{const t=this.types[this.bar.type]?.actions?.[0],e={id:`trg_${Math.random().toString(36).slice(2,10)}`,at:Bt(this.bar),jitter:0,action:{service:t?.service,entity_id:""}};this._emit({...this.bar,triggers:[...this._triggers,e]},!0),this._editing=e.id},this._saveTrigger=t=>{const e=t.detail;this._emit({...this.bar,triggers:this._triggers.map(t=>t.id===e.id?e:t)},!0),this._editing=null},this._deleteTrigger=t=>{this._emit({...this.bar,triggers:this._triggers.filter(e=>e.id!==t.detail)},!0),this._editing=null}}get _live(){return this.scheduleOn&&this.bar.enabled}_emit(t,e){this.dispatchEvent(new CustomEvent("bar-change",{detail:{bar:t,commit:e}}))}get _triggers(){return this.bar.triggers??[]}_dragTrigger(t,e){e.stopPropagation(),this._moved=!1;const i=e.clientX,s=t.at;this._drag={id:t.id,mode:"move"};const n=this.renderRoot.querySelector(".track"),r=e=>{const r=n.getBoundingClientRect().width,a=Math.round((e.clientX-i)/r*gt/bt)*bt;Math.abs(e.clientX-i)>3&&(this._moved=!0);const o=Math.max(0,Math.min(23.75,s+a));this._emit({...this.bar,triggers:this._triggers.map(e=>e.id===t.id?{...e,at:o}:e)},!1)},a=()=>{window.removeEventListener("pointermove",r),window.removeEventListener("pointerup",a),this._drag=null,this._moved&&this._emit(this.bar,!0)};window.addEventListener("pointermove",r),window.addEventListener("pointerup",a)}_triggerLabel(t){const e=t.action?.entity_id;return e?this.hass?.states?.[e]?.attributes?.friendly_name??e.split(".").pop()??e:"Pick action"}_dragSeg(t,e,i){if("move"===e&&(t.start_expr||t.end_expr)||"l"===e&&t.start_expr||"r"===e&&t.end_expr)return;i.stopPropagation(),this._moved=!1;const s=qt(this.bar,t),n=i.clientX,r=t.start,a=t.end;this._drag={id:t.id,mode:e};const o=this.renderRoot.querySelector(".track"),d=i=>{const d=o.getBoundingClientRect().width,l=Math.round((i.clientX-n)/d*gt/bt)*bt;Math.abs(i.clientX-n)>3&&(this._moved=!0);let c={...t};if("move"===e){const e=a-r,i=Math.min(s.max-e,Math.max(s.min,r+l));c={...t,start:i,end:i+e}}else c="l"===e?{...t,start:Math.min(a-bt,Math.max(s.min,r+l))}:{...t,end:Math.max(r+bt,Math.min(s.max,a+l))};this._emit({...this.bar,segments:this.bar.segments.map(e=>e.id===t.id?c:e)},!1)},l=()=>{window.removeEventListener("pointermove",d),window.removeEventListener("pointerup",l),this._drag=null,this._moved&&this._emit(this.bar,!0)};window.addEventListener("pointermove",d),window.addEventListener("pointerup",l)}render(){const t=$t(this.bar.type),e=this.types[this.bar.type],i=(s=this.types,n=this.bar.type,"stateless"===s[n]?.kind);var s,n;const r=Lt(this.bar),a=r.find(t=>t.id===this._editing),o=this._triggers.find(t=>t.id===this._editing);return q`
      <div
        class=${`bar ${this.reordering?"reordering":""} ${this._live?"":"disabled"}`}
        style=${`--accent:${t}`}
      >
        <div class="head">
          <button
            class="grip"
            title="Drag to reorder"
            @pointerdown=${this._reorderDown}
            @click=${t=>t.stopPropagation()}
          >
            <ha-icon icon="mdi:drag-horizontal-variant"></ha-icon>
          </button>
          <div class="icon"><ha-icon icon=${e?.icon??"mdi:calendar"}></ha-icon></div>
          <div class="meta">
            <div class="name">
              ${this.bar.name}
              ${this.conflicts.length?q`<span
                    class="chip"
                    style="color:var(--ds-warn);background:color-mix(in srgb,var(--ds-warn) 14%,transparent)"
                    title=${`Overlaps ${this.conflicts.join(", ")} on a shared entity`}
                  >
                    <ha-icon icon="mdi:alert" style="--mdc-icon-size:12px"></ha-icon> Conflict
                  </span>`:X}
            </div>
            <div class="targets">
              ${i?`${this._triggers.length} ${1===this._triggers.length?"trigger":"triggers"}`:this.bar.targets.join(" · ")||"No targets"}
            </div>
          </div>
          <div class="controls">
            <button
              class="iconbtn"
              title="Bar settings (name & targets)"
              @click=${()=>this._editing="__settings__"}
            >
              <ha-icon icon="mdi:cog-outline" style="--mdc-icon-size:17px"></ha-icon>
            </button>
            <button
              class="iconbtn"
              title=${i?"Add trigger":"Add segment"}
              @click=${i?this._addTrigger:this._addSegment}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
            </button>
            <button
              class="iconbtn"
              title="Duplicate bar"
              @click=${()=>this.dispatchEvent(new CustomEvent("bar-duplicate"))}
            >
              <ha-icon icon="mdi:content-copy" style="--mdc-icon-size:18px"></ha-icon>
            </button>
            <button
              class="iconbtn"
              title="Remove bar"
              @click=${()=>this.dispatchEvent(new CustomEvent("bar-remove"))}
            >
              <ha-icon icon="mdi:trash-can-outline" style="--mdc-icon-size:18px"></ha-icon>
            </button>
            <div class="divider"></div>
            <ha-switch
              .checked=${this.bar.enabled}
              title="Enable this bar"
              @change=${t=>this._emit({...this.bar,enabled:t.target.checked},!0)}
            ></ha-switch>
          </div>
        </div>

        ${i?this._renderTriggerTrack():this._renderSegmentTrack(r)}

        ${a?q`<ds-segment-editor
              .hass=${this.hass}
              .segment=${a}
              .type=${this.bar.type}
              .types=${this.types}
              .entities=${this.bar.targets}
              .bounds=${qt(this.bar,a)}
              .accent=${t}
              @segment-save=${this._saveSegment}
              @segment-delete=${this._deleteSegment}
              @popover-close=${()=>this._editing=null}
            ></ds-segment-editor>`:X}
        ${"__base__"===this._editing?q`<ds-base-popover
              .bar=${this.bar}
              .types=${this.types}
              .accent=${t}
              @base-pick=${this._pickBase}
              @popover-close=${()=>this._editing=null}
            ></ds-base-popover>`:X}
        ${"__settings__"===this._editing?q`<ds-bar-settings
              .hass=${this.hass}
              .bar=${this.bar}
              @bar-settings-save=${this._saveSettings}
              @popover-close=${()=>this._editing=null}
            ></ds-bar-settings>`:X}
        ${o?q`<ds-trigger-editor
              .hass=${this.hass}
              .trigger=${o}
              .actions=${this.types[this.bar.type]?.actions??[]}
              .accent=${t}
              @trigger-save=${this._saveTrigger}
              @trigger-delete=${this._deleteTrigger}
              @popover-close=${()=>this._editing=null}
            ></ds-trigger-editor>`:X}
      </div>
    `}_renderSegmentTrack(t){const e=$t(this.bar.type),i=St(this.types,this.bar.type,this.bar.base),s=(n=this.bar,r=this.now,Lt(n).find(t=>r>=t.start&&r<t.end));var n,r;return q`
      <div class="track" @click=${()=>this._editing="__base__"} style=${`--accent:${e}`}>
        <div
          class=${"base "+(i?"active":"")}
          title=${`Default: ${At(this.types,this.bar.type,this.bar.base)} — click to change`}
        >
          ${i?q`<span class="base-label"
                >default: ${At(this.types,this.bar.type,this.bar.base)}</span
              >`:X}
        </div>

        ${t.map(t=>this._renderSegment(t))}

        <div class="now" style=${`left:${this.now/gt*100}%`}></div>

        ${this.syncing&&this._live&&s?q`<div
              class="flash"
              style=${`left:${s.start/gt*100}%;width:${(s.end-s.start)/gt*100}%`}
            ></div>`:X}
        ${this.syncing&&this._live&&!s?q`<div class="flash base-flash"></div>`:X}
      </div>
    `}_renderTriggerTrack(){const t=$t(this.bar.type);return q`
      <div class="track trig" style=${`--accent:${t}`}>
        ${[6,12,18].map(t=>q`<div class="gl" style=${`left:${t/gt*100}%`}></div>`)}
        ${It(this.bar).map(t=>this._renderPin(t))}
        <div class="now" style=${`left:${this.now/gt*100}%`}></div>
      </div>
    `}_renderPin(t){const e=t.at/gt*100,i=this._drag?.id===t.id,s=this._triggerLabel(t),n=`${wt(t.at)} · ${s}${t.jitter?` · ${Ut(t.jitter)}`:""}`;return q`
      <div
        class=${"pin "+(i?"dragging":"")}
        style=${`left:${e}%`}
        title=${n}
        @pointerdown=${e=>this._dragTrigger(t,e)}
        @click=${e=>{e.stopPropagation(),this._moved||(this._editing=t.id)}}
      >
        <div class="flag">
          ${t.jitter?q`<ha-icon icon="mdi:dice-5" style="--mdc-icon-size:11px"></ha-icon>`:X}
          <span>${s}</span>
        </div>
        <div class="stem"></div>
        <div class="knob"></div>
        ${i?q`<div class="bubble pin-time">${wt(t.at)}</div>`:X}
      </div>
    `}_renderSegment(t){const e=St(this.types,this.bar.type,t.state),i=t.start/gt*100,s=(t.end-t.start)/gt*100,n=e?(r=this.types,a=this.bar.type,o=t,jt(r,a).map(t=>{if("media"===t.kind){const t=o.data?.media_title??o.data?.media_content_id;return t?String(t):""}const e=Tt(r,a,o.state,o,t);return null==e||""===e?"":"slider"===t.kind?`${Math.round(100*Number(e))}%`:"number"===t.kind?`${e}${t.unit??""}`:"select"===t.kind?Mt(String(e)):String(e)}).filter(Boolean).join(" · ")):"";var r,a,o;const d=n||At(this.types,this.bar.type,t.state),l=e?Pt(this.types,this.bar.type,t):"",c=this._drag?.id===t.id,h=c&&("move"===this._drag.mode||"l"===this._drag.mode),p=c&&("move"===this._drag.mode||"r"===this._drag.mode),u=`${Dt(t,"start")}–${Dt(t,"end")} · ${d}${t.jitter?` · ${Ut(t.jitter)}`:""}`;return q`
      <div
        class=${`seg ${e?"active":"inactive"} ${c?"dragging":""} ${t.start_expr?"solar-l":""} ${t.end_expr?"solar-r":""}`}
        style=${`left:${i}%;width:${s}%${l?`;--accent:${l}`:""}`}
        title=${u}
        @pointerdown=${e=>this._dragSeg(t,"move",e)}
        @click=${e=>{e.stopPropagation(),this._moved||(this._editing=t.id)}}
      >
        <div class="handle l" @pointerdown=${e=>this._dragSeg(t,"l",e)}>
          <span></span>
        </div>
        ${t.start_expr?this._renderSunEdge(t,"start"):X}
        ${s>8?q`<span class="seg-label"
              >${d}${t.jitter?q`<ha-icon icon="mdi:dice-5" style="--mdc-icon-size:12px"></ha-icon>`:X}</span
            >`:X}
        ${t.end_expr?this._renderSunEdge(t,"end"):X}
        <div class="handle r" @pointerdown=${e=>this._dragSeg(t,"r",e)}>
          <span></span>
        </div>
        ${h?q`<div class="bubble l">${wt(t.start)}</div>`:X}
        ${p?q`<div class="bubble r">${wt(t.end)}</div>`:X}
      </div>
    `}_renderSunEdge(t,e){const i="start"===e?t.start_expr:t.end_expr;if(!i)return X;const s=Nt(i.event)?.icon??"mdi:weather-sunny";return q`<div class=${"sun-edge "+("start"===e?"l":"r")} title=${Dt(t,e)}>
      <ha-icon icon=${s} style="--mdc-icon-size:11px"></ha-icon>
    </div>`}};Vt.styles=[Wt,a`
    .bar {
      margin-bottom: 14px;
      position: relative;
    }
    /* Disabled bars stay fully legible and editable — only the timeline is
       desaturated to signal "not running" (the per-bar switch carries the
       state). See issue #23. */
    .bar.disabled .track {
      filter: grayscale(1) brightness(0.92);
    }
    .bar.reordering {
      z-index: 5;
    }
    .bar.reordering .head,
    .bar.reordering .track {
      outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
      outline-offset: 3px;
      border-radius: 8px;
    }
    .bar.reordering .track {
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.5);
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 7px;
    }
    .grip {
      width: 20px;
      height: 30px;
      flex-shrink: 0;
      border: none;
      background: transparent;
      color: var(--ds-dim);
      cursor: grab;
      display: grid;
      place-items: center;
      padding: 0;
      touch-action: none;
    }
    .grip:hover {
      color: var(--ds-text);
    }
    .grip:active {
      cursor: grabbing;
    }
    .icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--ds-panel-hi);
      display: grid;
      place-items: center;
      color: var(--accent);
      flex-shrink: 0;
    }
    .meta {
      min-width: 0;
    }
    .name {
      font-size: 13.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--ds-text);
    }
    .targets {
      font-size: 11.5px;
      color: var(--ds-dim);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .controls {
      margin-left: auto;
      display: flex;
      gap: 2px;
      align-items: center;
    }
    .iconbtn {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      border: none;
      cursor: pointer;
      background: transparent;
      color: var(--ds-dim);
      display: grid;
      place-items: center;
    }
    .iconbtn:hover {
      background: var(--ds-panel-hi);
      color: var(--ds-text);
    }
    .divider {
      width: 1px;
      height: 20px;
      background: var(--ds-line);
      margin: 0 4px;
    }
    .track {
      position: relative;
      height: 46px;
      background: var(--ds-track-bg);
      border-radius: 8px;
      border: 1px solid var(--ds-line);
      overflow: hidden;
    }
    .base {
      position: absolute;
      inset: 0;
      cursor: pointer;
      background: var(--ds-panel-hi);
    }
    .base.active {
      background: repeating-linear-gradient(
        135deg,
        color-mix(in srgb, var(--accent) 80%, transparent) 0 8px,
        color-mix(in srgb, var(--accent) 60%, transparent) 8px 16px
      );
    }
    .base-label {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 9.5px;
      font-weight: 700;
      color: #1a1200;
      opacity: 0.8;
      pointer-events: none;
    }
    .seg {
      position: absolute;
      top: 3px;
      bottom: 3px;
      border-radius: 5px;
      cursor: grab;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .seg.active {
      background: linear-gradient(
        180deg,
        var(--accent),
        color-mix(in srgb, var(--accent) 80%, transparent)
      );
    }
    .seg.inactive {
      background: var(--ds-panel-hi);
      border: 1px solid var(--ds-line);
      outline: 1px solid var(--ds-dim);
    }
    .seg.dragging {
      z-index: 8;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
    }
    /* Solar edges (issue #3): a soft glow hints the boundary drifts by day. */
    .seg.solar-l {
      cursor: pointer;
    }
    .seg.solar-l::before,
    .seg.solar-r::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      width: 20px;
      pointer-events: none;
    }
    .seg.solar-l::before {
      left: 0;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
      background: linear-gradient(90deg, color-mix(in srgb, var(--ds-sun) 70%, transparent), transparent);
    }
    .seg.solar-r::after {
      right: 0;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
      background: linear-gradient(270deg, color-mix(in srgb, var(--ds-sun) 70%, transparent), transparent);
    }
    .sun-edge {
      position: absolute;
      top: -7px;
      z-index: 6;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: var(--ds-sun);
      color: #1a1200;
      display: grid;
      place-items: center;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      pointer-events: none;
    }
    .sun-edge.l {
      left: -8px;
    }
    .sun-edge.r {
      right: -8px;
    }
    .seg-label {
      font-size: 10.5px;
      font-weight: 600;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      color: #1a1200;
    }
    .seg.inactive .seg-label {
      color: var(--ds-dim);
    }
    .seg-sub {
      font-weight: 600;
      opacity: 0.72;
      font-variant-numeric: tabular-nums;
    }
    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 10px;
      cursor: ew-resize;
      display: flex;
      align-items: center;
      z-index: 5;
    }
    .handle.l {
      left: 0;
      justify-content: flex-start;
      padding-left: 2px;
    }
    .handle.r {
      right: 0;
      justify-content: flex-end;
      padding-right: 2px;
    }
    .handle span {
      width: 2.5px;
      height: 45%;
      background: rgba(255, 255, 255, 0.67);
      border-radius: 2px;
    }
    .bubble {
      position: absolute;
      top: 2px;
      background: #fff;
      color: #12161c;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      font-variant-numeric: tabular-nums;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      z-index: 12;
    }
    .bubble.l {
      left: 2px;
    }
    .bubble.r {
      right: 2px;
    }
    .now {
      position: absolute;
      top: -2px;
      bottom: -2px;
      width: 2px;
      background: var(--ds-now);
      z-index: 6;
      pointer-events: none;
    }
    .track.trig {
      height: 58px;
    }
    .gl {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--ds-line);
      opacity: 0.5;
    }
    .pin {
      position: absolute;
      top: 8px;
      bottom: 8px;
      width: 0;
      z-index: 4;
      cursor: grab;
    }
    .pin.dragging {
      z-index: 9;
      cursor: grabbing;
    }
    .pin .stem {
      position: absolute;
      left: -1px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: color-mix(in srgb, var(--accent) 85%, #000);
      pointer-events: none;
    }
    .pin .knob {
      position: absolute;
      bottom: -3px;
      left: -1px;
      transform: translateX(-50%);
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--ds-track-bg);
      pointer-events: none;
    }
    .pin .flag {
      position: absolute;
      top: -4px;
      left: -1px;
      transform: translateX(-50%);
      background: var(--accent);
      color: #1a2400;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    }
    .pin.dragging .flag {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    }
    .pin .bubble.pin-time {
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
    }
    .flash {
      position: absolute;
      top: 1px;
      bottom: 1px;
      border-radius: 6px;
      border: 2px solid #fff;
      z-index: 7;
      pointer-events: none;
      animation: ds-pulse 0.6s ease-in-out 2;
    }
    .flash.base-flash {
      inset: 1px;
      width: auto;
    }
    @keyframes ds-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.25;
      }
    }
  `],t([pt({attribute:!1})],Vt.prototype,"hass",void 0),t([pt({attribute:!1})],Vt.prototype,"bar",void 0),t([pt({attribute:!1})],Vt.prototype,"types",void 0),t([pt({type:Boolean})],Vt.prototype,"scheduleOn",void 0),t([pt({attribute:!1})],Vt.prototype,"conflicts",void 0),t([pt({type:Number})],Vt.prototype,"now",void 0),t([pt({type:Boolean})],Vt.prototype,"syncing",void 0),t([pt({type:Boolean})],Vt.prototype,"reordering",void 0),t([ut()],Vt.prototype,"_editing",void 0),t([ut()],Vt.prototype,"_drag",void 0),Vt=t([lt("ds-bar")],Vt);let Ft=class extends ot{constructor(){super(...arguments),this.accent="",this.entities=[],this._si=0,this._startClock="",this._endClock="",this._startExpr=null,this._endExpr=null,this._jit=0,this._err="",this._data={},this._close=()=>this.dispatchEvent(new CustomEvent("popover-close")),this._delete=()=>this.dispatchEvent(new CustomEvent("segment-delete",{detail:this.segment.id}))}willUpdate(t){t.has("segment")&&(this._si=this.segment.state,this._startClock=wt(this.segment.start),this._endClock=wt(this.segment.end),this._startExpr=this.segment.start_expr??null,this._endExpr=this.segment.end_expr??null,this._jit=this.segment.jitter??0,this._data={...this.segment.data??{}},this._err=""),this._seedRequiredSelects()}_expr(t){return"start"===t?this._startExpr:this._endExpr}_setExpr(t,e){"start"===t?this._startExpr=e:this._endExpr=e,this._err=""}_setMode(t,e){if("sun"===e)this._expr(t)||this._setExpr(t,{event:"sunset",offset:0});else{const e="start"===t?this.segment.start:this.segment.end,i=Ht(this.hass,e,this._expr(t));"start"===t?this._startClock=wt(i):this._endClock=wt(i),this._setExpr(t,null)}}_stepOffset(t,e){const i=this._expr(t);if(!i)return;const s=Math.round((i.offset+e*bt)/bt)*bt,n=Math.max(-2,Math.min(2,s));this._setExpr(t,{...i,offset:Math.round(1e4*n)/1e4})}_resolvedHint(t){const e=this._expr(t);if(!e)return null;if(void 0===this.hass?.states?.["sun.sun"])return null;const i="start"===t?this.segment.start:this.segment.end;return wt(Ht(this.hass,i,e))}_seedRequiredSelects(){for(const t of this._params){if("select"!==t.kind||t.optional)continue;const e=this._data[t.key];if(void 0!==e&&""!==e)continue;const i=zt(this.hass,this.entities,t);i.length&&(this._data={...this._data,[t.key]:i[0].value})}}get _params(){return St(this.types,this.type,this._si)?jt(this.types,this.type):[]}_setParam(t,e){this._data={...this._data,[t]:e}}_paramNumber(t){const e=Tt(this.types,this.type,this._si,{data:this._data},t);return"number"==typeof e?e:Number(e??t.default??0)}_step(t,e){const i=t.step??1;let s=this._paramNumber(t)+e*i;void 0!==t.min&&(s=Math.max(t.min,s)),void 0!==t.max&&(s=Math.min(t.max,s)),s=Math.round(s/i)*i,this._setParam(t.key,Math.round(1e4*s)/1e4)}_save(){let t,e;if(this._startExpr)t=Et(Ht(this.hass,this.segment.start,this._startExpr));else{const e=kt(this._startClock);if(null==e)return this._fail("Use HH:MM");t=e}if(this._endExpr)e=Et(Ht(this.hass,this.segment.end,this._endExpr));else{const t=kt(this._endClock);if(null==t)return this._fail("Use HH:MM");e=t}if(!this._startExpr&&!this._endExpr){if(e<=t)return this._fail("End must be after start");if(t<this.bounds.min||e>this.bounds.max)return this._fail(`Stay within ${wt(this.bounds.min)}–${wt(this.bounds.max)}`)}const i=new Set;for(const t of this._params)for(const e of Ot(t))i.add(e);const s={};for(const t of i)void 0!==this._data[t]&&(s[t]=this._data[t]);this.dispatchEvent(new CustomEvent("segment-save",{detail:{...this.segment,state:this._si,start:t,end:e,jitter:this._jit,data:s,start_expr:this._startExpr,end_expr:this._endExpr}}))}_fail(t){this._err=t}render(){const t=this.types[this.type]?.states??[];return q`
      <div class="popover" style="width:268px" @click=${t=>t.stopPropagation()}>
        <div class="popover-head">
          <span>Edit segment</span>
          <button @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
        </div>

        <div class="field-label">State</div>
        <div class="state-buttons" style=${`--accent:${this.accent}`}>
          ${t.map((t,e)=>q`
              <button
                class=${e===this._si?"sel":""}
                style=${t.color&&e===this._si?`--accent:${t.color}`:""}
                @click=${()=>this._si=e}
              >
                ${t.label}
              </button>
            `)}
        </div>

        ${this._params.map(t=>this._renderParam(t))}

        ${this._renderBoundary("start")} ${this._renderBoundary("end")}
        <div class="hint" style=${"color:"+(this._err?"var(--ds-warn)":"var(--ds-dim)")}>
          ${this._err||`Available ${wt(this.bounds.min)}–${wt(this.bounds.max)}`}
        </div>

        <div class="jitter-head">
          <ha-icon icon="mdi:dice-5" style="--mdc-icon-size:14px"></ha-icon> Daily jitter
          <span class="sub">randomises boundaries ±</span>
        </div>
        <div class="jitter">
          ${mt.map(t=>q`
              <button
                class=${Math.abs(this._jit-t.v)<.001?"sel":""}
                @click=${()=>this._jit=t.v}
              >
                ${t.label}
              </button>
            `)}
        </div>

        <div class="actions">
          <button class="btn ghost" @click=${this._delete}>
            <ha-icon icon="mdi:trash-can-outline" style="--mdc-icon-size:15px"></ha-icon> Delete
          </button>
          <button class="btn primary" @click=${this._save}>
            <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon> Save
          </button>
        </div>
      </div>
    `}_renderBoundary(t){const e=this._expr(t),i="start"===t?"Start":"End",s="start"===t?this._startClock:this._endClock,n=this._resolvedHint(t);return q`
      <div class="bnd">
        <div class="bnd-head">
          <span class="lbl">${i}</span>
          <span class="toggle">
            <button
              class=${e?"":"sel"}
              @click=${()=>this._setMode(t,"clock")}
            >
              <ha-icon icon="mdi:clock-outline" style="--mdc-icon-size:13px"></ha-icon>Clock
            </button>
            <button
              class=${e?"sel sun":""}
              @click=${()=>this._setMode(t,"sun")}
            >
              <ha-icon icon="mdi:weather-sunny" style="--mdc-icon-size:13px"></ha-icon>Sun
            </button>
          </span>
        </div>
        ${e?q`
              <div class="evrow">
                ${_t.map(i=>q`
                    <button
                      class=${"sbtn "+(e.event===i.key?"sel":"")}
                      title=${i.label}
                      @click=${()=>this._setExpr(t,{...e,event:i.key})}
                    >
                      <ha-icon icon=${i.icon} style="--mdc-icon-size:14px"></ha-icon>
                      ${i.label}
                    </button>
                  `)}
              </div>
              <div class="offrow">
                <span class="k">Offset</span>
                <div class="stepper">
                  <button
                    @click=${()=>this._stepOffset(t,-1)}
                    ?disabled=${e.offset<=-2}
                    aria-label="Earlier"
                  >
                    <ha-icon icon="mdi:minus" style="--mdc-icon-size:15px"></ha-icon>
                  </button>
                  <span class="val">${Rt(e.offset)}</span>
                  <button
                    @click=${()=>this._stepOffset(t,1)}
                    ?disabled=${e.offset>=2}
                    aria-label="Later"
                  >
                    <ha-icon icon="mdi:plus" style="--mdc-icon-size:15px"></ha-icon>
                  </button>
                </div>
              </div>
              ${n?q`<div class="resolved">
                    <ha-icon icon="mdi:weather-sunset" style="--mdc-icon-size:13px"></ha-icon>
                    ≈ ${n} today
                  </div>`:q`<div class="hint" style="margin:8px 0 0">
                    Resolves per day from your location’s ${Nt(e.event)?.label??""}.
                  </div>`}
            `:q`
              <input
                class="time"
                .value=${s}
                @input=${e=>{const i=e.target.value;"start"===t?this._startClock=i:this._endClock=i,this._err=""}}
              />
            `}
      </div>
    `}_renderParam(t){return"select"===t.kind?this._renderSelect(t):"slider"===t.kind?this._renderSlider(t):"media"===t.kind?this._renderMedia(t):this._renderStepper(t)}_renderSelect(t){const e=zt(this.hass,this.entities,t);if(!e.length)return t.optional?X:q`
        <div class="field-label" style="margin-top:12px">${t.label}</div>
        <div class="hint" style="color:var(--ds-dim)">
          Pick a target entity to choose ${t.label.toLowerCase()} options.
        </div>
      `;const i=String(Tt(this.types,this.type,this._si,{data:this._data},t)??"");return q`
      <div class="field-label" style="margin-top:12px">${t.label}</div>
      <div class="state-buttons" style=${`--accent:${this.accent}`}>
        ${e.map(e=>q`
            <button
              class=${e.value===i?"sel":""}
              @click=${()=>this._setParam(t.key,e.value)}
            >
              ${e.label}
            </button>
          `)}
      </div>
    `}_renderStepper(t){const e=this._paramNumber(t),i=(t.step??1)<1?1:0;return q`
      <div class="field-label" style="margin-top:12px">${t.label}</div>
      <div class="stepper" style=${`--accent:${this.accent}`}>
        <button
          @click=${()=>this._step(t,-1)}
          ?disabled=${void 0!==t.min&&e<=t.min}
          aria-label=${`Decrease ${t.label}`}
        >
          <ha-icon icon="mdi:minus" style="--mdc-icon-size:16px"></ha-icon>
        </button>
        <span class="val">${e.toFixed(i)}${t.unit??""}</span>
        <button
          @click=${()=>this._step(t,1)}
          ?disabled=${void 0!==t.max&&e>=t.max}
          aria-label=${`Increase ${t.label}`}
        >
          <ha-icon icon="mdi:plus" style="--mdc-icon-size:16px"></ha-icon>
        </button>
      </div>
    `}_renderSlider(t){const e=this._paramNumber(t);return q`
      <div class="field-label" style="margin-top:12px;display:flex;align-items:center">
        ${t.label}
        <span style="margin-left:auto;color:var(--ds-text);font-weight:700"
          >${Math.round(100*e)}%</span
        >
      </div>
      <input
        class="range"
        style=${`--accent:${this.accent}`}
        type="range"
        min=${t.min??0}
        max=${t.max??1}
        step=${t.step??.05}
        .value=${String(e)}
        @input=${e=>this._setParam(t.key,Number(e.target.value))}
      />
    `}_renderMedia(t){const e=this.entities[0];if(!e)return q`
        <div class="field-label" style="margin-top:12px">${t.label}</div>
        <div class="hint" style="color:var(--ds-dim)">
          Pick a target entity on the bar to choose media.
        </div>
      `;const i={entity_id:e,media_content_id:this._data.media_content_id,media_content_type:this._data.media_content_type};return q`
      <div class="field-label" style="margin-top:12px">${t.label}</div>
      <ha-selector
        .hass=${this.hass}
        .selector=${{media:{}}}
        .context=${{filter_entity:e}}
        .value=${i}
        @value-changed=${t=>this._onMedia(t.detail.value)}
      ></ha-selector>
    `}_onMedia(t){this._data={...this._data,media_content_id:t?.media_content_id,media_content_type:t?.media_content_type??"music",media_title:t?.metadata?.title}}};Ft.styles=[Wt,a`
      .row {
        display: flex;
        gap: 10px;
        margin: 14px 0 6px;
      }
      .row > div {
        flex: 1;
      }
      .hint {
        font-size: 10.5px;
        margin-bottom: 12px;
      }
      .jitter-head {
        font-size: 11px;
        color: var(--ds-dim);
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .jitter-head .sub {
        margin-left: auto;
        color: var(--ds-dim);
        opacity: 0.7;
        font-size: 10px;
      }
      .jitter {
        display: flex;
        gap: 5px;
        margin-bottom: 14px;
      }
      .jitter button {
        flex: 1;
        padding: 6px 0;
        border-radius: 7px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid var(--ds-line);
        background: transparent;
        color: var(--ds-dim);
        font-family: inherit;
      }
      .jitter button.sel {
        border-color: var(--ds-accent);
        background: color-mix(in srgb, var(--ds-accent) 18%, transparent);
        color: var(--ds-text);
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      .stepper {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .stepper button {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        border: 1px solid var(--ds-line);
        background: var(--ds-track-bg);
        color: var(--ds-text);
        cursor: pointer;
        display: grid;
        place-items: center;
        font-family: inherit;
      }
      .stepper button:hover:not([disabled]) {
        border-color: var(--accent, var(--ds-accent));
      }
      .stepper button[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .stepper .val {
        flex: 1;
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--ds-text);
      }
      input.range {
        width: 100%;
        margin: 4px 0 2px;
        accent-color: var(--accent, var(--ds-accent));
        cursor: pointer;
      }
      /* -- sun-relative boundary editor (issue #3) -- */
      .bnd {
        border: 1px solid var(--ds-line);
        border-radius: 10px;
        padding: 10px;
        margin: 12px 0 0;
      }
      .bnd-head {
        display: flex;
        align-items: center;
        margin-bottom: 9px;
      }
      .bnd-head .lbl {
        font-size: 12px;
        font-weight: 700;
      }
      .toggle {
        margin-left: auto;
        display: inline-flex;
        border: 1px solid var(--ds-line);
        border-radius: 8px;
        overflow: hidden;
      }
      .toggle button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 9px;
        font-size: 11px;
        font-weight: 600;
        background: transparent;
        color: var(--ds-dim);
        border: none;
        cursor: pointer;
        font-family: inherit;
      }
      .toggle button.sel {
        background: color-mix(in srgb, var(--ds-accent) 20%, transparent);
        color: var(--ds-text);
      }
      .toggle button.sel.sun {
        background: color-mix(in srgb, var(--ds-sun) 26%, transparent);
        color: #ffe9b0;
      }
      .evrow {
        display: flex;
        gap: 6px;
        margin-bottom: 9px;
      }
      .evrow .sbtn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px 4px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid var(--ds-line);
        background: transparent;
        color: var(--ds-dim);
        cursor: pointer;
        font-family: inherit;
      }
      .evrow .sbtn.sel {
        border-color: var(--ds-sun);
        background: color-mix(in srgb, var(--ds-sun) 18%, transparent);
        color: var(--ds-text);
      }
      .offrow {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .offrow .k {
        font-size: 11px;
        color: var(--ds-dim);
        width: 44px;
      }
      .offrow .stepper {
        flex: 1;
      }
      .resolved {
        margin-top: 9px;
        font-size: 11px;
        color: #ffe0a3;
        display: flex;
        align-items: center;
        gap: 6px;
        background: color-mix(in srgb, var(--ds-sun) 12%, transparent);
        border-radius: 7px;
        padding: 5px 8px;
      }
      .resolved ha-icon {
        color: var(--ds-sun);
      }
    `],t([pt({attribute:!1})],Ft.prototype,"hass",void 0),t([pt({attribute:!1})],Ft.prototype,"segment",void 0),t([pt()],Ft.prototype,"type",void 0),t([pt({attribute:!1})],Ft.prototype,"types",void 0),t([pt({attribute:!1})],Ft.prototype,"bounds",void 0),t([pt({attribute:!1})],Ft.prototype,"accent",void 0),t([pt({attribute:!1})],Ft.prototype,"entities",void 0),t([ut()],Ft.prototype,"_si",void 0),t([ut()],Ft.prototype,"_startClock",void 0),t([ut()],Ft.prototype,"_endClock",void 0),t([ut()],Ft.prototype,"_startExpr",void 0),t([ut()],Ft.prototype,"_endExpr",void 0),t([ut()],Ft.prototype,"_jit",void 0),t([ut()],Ft.prototype,"_err",void 0),t([ut()],Ft.prototype,"_data",void 0),Ft=t([lt("ds-segment-editor")],Ft);let Yt=class extends ot{constructor(){super(...arguments),this.accent=""}render(){const t=this.types[this.bar.type]?.states??[];return q`
      <div class="popover" style="width:240px" @click=${t=>t.stopPropagation()}>
        <div class="popover-head">
          <span>Default state</span>
          <button @click=${()=>this.dispatchEvent(new CustomEvent("popover-close"))}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="field-label" style="margin-bottom:10px;line-height:1.5">
          Applied to all time not covered by a segment.
        </div>
        <div class="state-buttons" style=${`--accent:${this.accent}`}>
          ${t.map((t,e)=>q`
              <button
                class=${this.bar.base===e?"sel":""}
                @click=${()=>this.dispatchEvent(new CustomEvent("base-pick",{detail:e}))}
              >
                ${t.label}
              </button>
            `)}
        </div>
      </div>
    `}};Yt.styles=[Wt],t([pt({attribute:!1})],Yt.prototype,"bar",void 0),t([pt({attribute:!1})],Yt.prototype,"types",void 0),t([pt()],Yt.prototype,"accent",void 0),Yt=t([lt("ds-base-popover")],Yt);let Jt=class extends ot{constructor(){super(...arguments),this._config={type:"custom:daily-schedule-card"},this._entries=[]}setConfig(t){this._config=t}async firstUpdated(){try{const t=await this.hass.callWS({type:`${vt}/list_entries`});this._entries=t.entries}catch{this._entries=[]}}_emit(t){const e={...this._config,...t};this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}render(){return q`
      <div class="form">
        <ha-select
          label="Schedule"
          .value=${this._config.entry_id??""}
          @selected=${t=>this._emit({entry_id:t.target.value||void 0})}
          @closed=${t=>t.stopPropagation()}
          naturalMenuWidth
          fixedMenuPosition
        >
          <mwc-list-item value="">Auto (single schedule)</mwc-list-item>
          ${this._entries.map(t=>q`<mwc-list-item value=${t.entry_id}>${t.title}</mwc-list-item>`)}
        </ha-select>
        <ha-textfield
          label="Title (optional)"
          .value=${this._config.title??""}
          @input=${t=>this._emit({title:t.target.value||void 0})}
        ></ha-textfield>
        <div class="hint">
          Leave the schedule on “Auto” when you only have one Daily Schedule set up.
        </div>
      </div>
    `}};Jt.styles=a`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    ha-textfield,
    ha-select {
      width: 100%;
    }
    .hint {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
  `,t([pt({attribute:!1})],Jt.prototype,"hass",void 0),t([ut()],Jt.prototype,"_config",void 0),t([ut()],Jt.prototype,"_entries",void 0),Jt=t([lt("ds-editor")],Jt);const Zt=()=>{const t=new Date;return t.getHours()+t.getMinutes()/60+t.getSeconds()/3600};let Gt=class extends ot{constructor(){super(...arguments),this._types={},this._now=Zt(),this._syncing=!1,this._menuOpen=!1,this._connecting=!1,this._onBarChange=(t,e)=>{this._schedule&&(this._schedule={...this._schedule,bars:this._schedule.bars.map(e=>e.id===t.id?t:e)},e&&this._ws("update_bar",{bar_id:t.id,bar:t}))},this._onReorderStart=t=>{if(!this._schedule)return;this._reorderId=t.detail.id;const e=t=>this._onReorderMove(t),i=()=>{window.removeEventListener("pointermove",e),window.removeEventListener("pointerup",i);const t=this._schedule?.bars.map(t=>t.id)??[];this._reorderId=void 0,this._ws("reorder_bars",{order:t})};window.addEventListener("pointermove",e),window.addEventListener("pointerup",i)}}static getConfigElement(){return document.createElement("ds-editor")}static getStubConfig(){return{entry_id:""}}setConfig(t){this._config=t,this._entryId=t.entry_id||void 0,this._connectedEntry&&this._connectedEntry!==this._entryId&&this._teardown()}connectedCallback(){super.connectedCallback(),this._nowTimer=window.setInterval(()=>this._now=Zt(),3e4),this._maybeConnect()}disconnectedCallback(){super.disconnectedCallback(),this._nowTimer&&window.clearInterval(this._nowTimer),this._teardown()}updated(){this._maybeConnect()}async _maybeConnect(){if(this.hass&&!this._connectedEntry&&!this._connecting){this._connecting=!0;try{await this._connect()}finally{this._connecting=!1}}}async _connect(){if(!this._entryId)try{const t=await this.hass.callWS({type:`${vt}/list_entries`});if(this._types=t.types,1!==t.entries.length)return 0===t.entries.length?void(this._error="No Daily Schedule is set up. Add the integration first."):void(this._error="Multiple schedules found — set entry_id in the card config.");this._entryId=t.entries[0].entry_id}catch(t){return void(this._error=`Could not reach Daily Schedule: ${t}`)}this._connectedEntry=this._entryId,this._error=void 0;try{this._unsub=this.hass.connection.subscribeMessage(t=>{this._schedule=t},{type:`${vt}/subscribe`,entry_id:this._entryId});const t=await this.hass.callWS({type:`${vt}/get`,entry_id:this._entryId});this._types=t.types,this._schedule=t}catch(t){this._error=`Could not load schedule: ${t}`,this._connectedEntry=void 0}}_teardown(){this._unsub?.then(t=>t()).catch(()=>{}),this._unsub=void 0,this._connectedEntry=void 0,this._schedule=void 0}async _ws(t,e={}){try{await this.hass.callWS({type:`${vt}/${t}`,entry_id:this._entryId,...e})}catch(e){this._error=`${t} failed: ${e}`}}_setEnabled(t){this._schedule&&(this._schedule={...this._schedule,enabled:t}),this._ws("set_enabled",{enabled:t})}async _syncNow(){this._schedule?.enabled&&(this._syncing=!0,await this._ws("sync_now"),window.setTimeout(()=>this._syncing=!1,1400))}_onReorderMove(t){if(!this._reorderId||!this._schedule)return;const e=this._schedule.bars,i=e.find(t=>t.id===this._reorderId);if(!i)return;const s=[...this.renderRoot.querySelectorAll("ds-bar")],n=new Map;e.forEach((t,e)=>{const i=s[e]?.getBoundingClientRect();i&&n.set(t.id,i)});const r=e.filter(t=>t.id!==this._reorderId);let a=r.length;for(let e=0;e<r.length;e++){const i=n.get(r[e].id);if(i&&t.clientY<i.top+i.height/2){a=e;break}}const o=[...r.slice(0,a),i,...r.slice(a)];o.some((t,i)=>t.id!==e[i].id)&&(this._schedule={...this._schedule,bars:o})}_addBar(t){this._menuOpen=!1;const e=this._types[t];if("stateless"===e?.kind){const i=e.actions?.[0];return void this._ws("add_bar",{bar:{name:"New triggers",type:t,targets:[],enabled:!0,triggers:[{at:12,jitter:0,action:{service:i?.service,entity_id:""}}]}})}this._ws("add_bar",{bar:{name:"New schedule",type:t,targets:[],base:0,enabled:!0,segments:[{start:8,end:18,state:1,jitter:0}]}})}render(){if(this._error)return this._card(q`<div class="error">${this._error}</div>`);if(!this._schedule)return this._card(q`<div class="loading">Loading…</div>`);const t=this._schedule,e=t.bars.length,i=this._config?.title??"Daily Schedule";return this._card(q`
      <div class="header">
        <div>
          <div class="title">${i}</div>
          <div class="subtitle">
            Repeats every day · ${e} ${1===e?"bar":"bars"}
          </div>
        </div>
        <div class="header-right">
          <button
            class="sync ${this._syncing?"on":""}"
            ?disabled=${!t.enabled}
            title="Set every entity to its state for the current time"
            @click=${this._syncNow}
          >
            <ha-icon
              icon="mdi:refresh"
              class=${this._syncing?"spin":""}
              style="--mdc-icon-size:16px"
            ></ha-icon>
            ${this._syncing?"Syncing…":"Sync now"}
          </button>
          <div class="vdiv"></div>
          <span class="enabled-label" style=${t.enabled?"color:var(--ds-accent)":""}>
            ${t.enabled?"Enabled":"Disabled"}
          </span>
          <ha-switch
            .checked=${t.enabled}
            @change=${t=>this._setEnabled(t.target.checked)}
          ></ha-switch>
        </div>
      </div>

      <div class="body">
        <div class="ruler">
          ${[0,6,12,18,24].map(t=>q`<span
              class="tick"
              style=${`left:${t/gt*100}%;transform:${0===t?"none":24===t?"translateX(-100%)":"translateX(-50%)"}`}
              >${wt(t)}</span
            >`)}
          <span class="now-label" style=${`left:${this._now/gt*100}%`}>${wt(this._now)}</span>
        </div>

        <div class="bars" @bar-reorder-start=${this._onReorderStart}>
          <div class="gridlines">
            ${[6,12,18].map(t=>q`<div class="gl" style=${`left:${t/gt*100}%`}></div>`)}
          </div>
          ${t.bars.map(e=>q`
              <ds-bar
                .hass=${this.hass}
                .bar=${e}
                .types=${this._types}
                .scheduleOn=${t.enabled}
                .conflicts=${t.conflicts?.[e.id]??[]}
                .now=${this._now}
                .syncing=${this._syncing}
                .reordering=${e.id===this._reorderId}
                @bar-change=${t=>this._onBarChange(t.detail.bar,t.detail.commit)}
                @bar-remove=${()=>this._ws("delete_bar",{bar_id:e.id})}
                @bar-duplicate=${()=>this._ws("duplicate_bar",{bar_id:e.id})}
              ></ds-bar>
            `)}
        </div>

        <div class="add-wrap">
          <button class="add" @click=${()=>this._menuOpen=!this._menuOpen}>
            <ha-icon icon="mdi:plus" style="--mdc-icon-size:18px"></ha-icon> Add schedule bar
          </button>
          ${this._menuOpen?q`<div class="menu">
                ${Object.entries(this._types).map(([t,e])=>q`
                    <button @click=${()=>this._addBar(t)}>
                      <ha-icon icon=${e.icon} style=${`color:${$t(t)}`}></ha-icon>
                      <span class="cap">${t}</span>
                      <span class="states"
                        >${"stateless"===e.kind?(e.actions??[]).map(t=>t.label).join(" / "):(e.states??[]).map(t=>t.label).join(" / ")}</span
                      >
                    </button>
                  `)}
              </div>`:X}
        </div>
      </div>

      <div class="footer">
        Striped/plain fill = default state (click to change) · tap a segment to edit state, times
        &amp; jitter · drag to move or resize · drag the ⠿ grip to reorder bars · per-bar toggle on
        the right
      </div>
    `)}_card(t){return q`<ha-card>${t}</ha-card>`}getCardSize(){return 3+(this._schedule?.bars.length??1)}};Gt.styles=[Wt,a`
    ha-card {
      overflow: visible;
    }
    .error,
    .loading {
      padding: 24px 20px;
      color: var(--ds-dim);
    }
    .error {
      color: var(--ds-warn);
    }
    .header {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 1px solid var(--ds-line);
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--ds-text);
    }
    .subtitle {
      font-size: 12.5px;
      color: var(--ds-dim);
      margin-top: 2px;
    }
    .header-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sync {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 9px;
      border: 1px solid var(--ds-line);
      background: transparent;
      color: var(--ds-text);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .sync.on {
      background: color-mix(in srgb, var(--ds-accent) 14%, transparent);
      color: var(--ds-accent);
    }
    .sync[disabled] {
      color: var(--ds-dim);
      cursor: not-allowed;
      opacity: 0.6;
    }
    .spin {
      animation: ds-spin 0.8s linear infinite;
    }
    @keyframes ds-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .vdiv {
      width: 1px;
      height: 22px;
      background: var(--ds-line);
    }
    .enabled-label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--ds-dim);
    }
    .body {
      padding: 14px 18px 6px;
    }
    .ruler {
      position: relative;
      height: 16px;
      margin-bottom: 4px;
    }
    .tick {
      position: absolute;
      top: 0;
      font-size: 10.5px;
      color: var(--ds-dim);
      font-variant-numeric: tabular-nums;
    }
    .now-label {
      position: absolute;
      top: -1px;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 700;
      color: var(--ds-now);
      font-variant-numeric: tabular-nums;
      background: var(--ds-panel);
      padding: 0 3px;
      border-radius: 3px;
    }
    .bars {
      position: relative;
    }
    .gridlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .gl {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--ds-line);
      opacity: 0.5;
    }
    .add-wrap {
      position: relative;
      padding: 6px 0 14px;
    }
    .add {
      width: 100%;
      padding: 11px;
      border-radius: 10px;
      cursor: pointer;
      background: transparent;
      border: 1.5px dashed var(--ds-line);
      color: var(--ds-dim);
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      font-family: inherit;
    }
    .menu {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 56px;
      background: var(--ds-panel-hi);
      border-radius: 12px;
      border: 1px solid var(--ds-line);
      padding: 6px;
      z-index: 30;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    }
    .menu button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      background: transparent;
      color: var(--ds-text);
      font-size: 13px;
      text-align: left;
      font-family: inherit;
    }
    .menu button:hover {
      background: var(--ds-panel);
    }
    .menu .cap {
      text-transform: capitalize;
    }
    .menu .states {
      margin-left: auto;
      font-size: 11px;
      color: var(--ds-dim);
    }
    .footer {
      padding: 6px 18px 16px;
      font-size: 11.5px;
      color: var(--ds-dim);
      line-height: 1.7;
      text-align: center;
    }
  `],t([pt({attribute:!1})],Gt.prototype,"hass",void 0),t([ut()],Gt.prototype,"_config",void 0),t([ut()],Gt.prototype,"_schedule",void 0),t([ut()],Gt.prototype,"_types",void 0),t([ut()],Gt.prototype,"_entryId",void 0),t([ut()],Gt.prototype,"_error",void 0),t([ut()],Gt.prototype,"_now",void 0),t([ut()],Gt.prototype,"_syncing",void 0),t([ut()],Gt.prototype,"_menuOpen",void 0),t([ut()],Gt.prototype,"_reorderId",void 0),Gt=t([lt("daily-schedule-card")],Gt),window.customCards=window.customCards||[],window.customCards.push({type:"daily-schedule-card",name:"Daily Schedule",description:"Build a repeating 24-hour schedule that drives your entities.",preview:!1});export{Gt as DailyScheduleCard};

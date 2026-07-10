function t(t,e,i,s){var n,a=arguments.length,r=a<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var o=t.length-1;o>=0;o--)(n=t[o])&&(r=(a<3?n(r):a>3?n(e,i,r):n(e,i))||r);return a>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let a=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new a(i,t,s)},o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:d,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,v=globalThis,b=v.trustedTypes,m=b?b.emptyScript:"",g=v.reactiveElementPolyfillSupport,_=(t,e)=>t,f={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!d(t,e),$={attribute:!0,type:String,converter:f,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),v.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const a=s?.call(this);n?.call(this,e),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??$}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:f).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:f;this._$Em=s;const a=n.fromAttribute(e,t.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const a=this.constructor;if(!1===s&&(n=this[t]),i??=a.getPropertyOptions(t),!((i.hasChanged??y)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),!0!==n||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[_("elementProperties")]=new Map,x[_("finalized")]=new Map,g?.({ReactiveElement:x}),(v.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,A=t=>t,S=w.trustedTypes,E=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+C,z=`<${M}>`,P=document,O=()=>P.createComment(""),j=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,N="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,R=/>/g,D=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),B=/'/g,I=/"/g,L=/^(?:script|style|textarea|title)$/i,W=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),q=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),X=new WeakMap,F=P.createTreeWalker(P,129);function J(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const K=(t,e)=>{const i=t.length-1,s=[];let n,a=2===e?"<svg>":3===e?"<math>":"",r=T;for(let e=0;e<i;e++){const i=t[e];let o,d,l=-1,c=0;for(;c<i.length&&(r.lastIndex=c,d=r.exec(i),null!==d);)c=r.lastIndex,r===T?"!--"===d[1]?r=H:void 0!==d[1]?r=R:void 0!==d[2]?(L.test(d[2])&&(n=RegExp("</"+d[2],"g")),r=D):void 0!==d[3]&&(r=D):r===D?">"===d[0]?(r=n??T,l=-1):void 0===d[1]?l=-2:(l=r.lastIndex-d[2].length,o=d[1],r=void 0===d[3]?D:'"'===d[3]?I:B):r===I||r===B?r=D:r===H||r===R?r=T:(r=D,n=void 0);const h=r===D&&t[e+1].startsWith("/>")?" ":"";a+=r===T?i+z:l>=0?(s.push(o),i.slice(0,l)+k+i.slice(l)+C+h):i+C+(-2===l?e:h)}return[J(t,a+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const r=t.length-1,o=this.parts,[d,l]=K(t,e);if(this.el=Z.createElement(d,i),F.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=F.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(k)){const e=l[a++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);o.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?et:"?"===r[1]?it:"@"===r[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(C)&&(o.push({type:6,index:n}),s.removeAttribute(t));if(L.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],O()),F.nextNode(),o.push({type:2,index:++n});s.append(t[e],O())}}}else if(8===s.nodeType)if(s.data===M)o.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)o.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function Y(t,e,i=t,s){if(e===q)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const a=j(e)?void 0:e._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),void 0===a?n=void 0:(n=new a(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Y(t,n._$AS(t,e.values),n,s)),e}class G{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);F.currentNode=s;let n=F.nextNode(),a=0,r=0,o=i[0];for(;void 0!==o;){if(a===o.index){let e;2===o.type?e=new Q(n,n.nextSibling,this,t):1===o.type?e=new o.ctor(n,o.name,o.strings,this,t):6===o.type&&(e=new nt(n,this,t)),this._$AV.push(e),o=i[++r]}a!==o?.index&&(n=F.nextNode(),a++)}return F.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),j(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&j(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Z.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new G(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=X.get(t.strings);return void 0===e&&X.set(t.strings,e=new Z(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new Q(this.O(O()),this.O(O()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=V}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(void 0===n)t=Y(this,t,e,0),a=!j(t)||t!==this._$AH&&t!==q,a&&(this._$AH=t);else{const s=t;let r,o;for(t=n[0],r=0;r<n.length-1;r++)o=Y(this,s[i+r],e,r),o===q&&(o=this._$AH[r]),a||=!j(o)||o!==this._$AH[r],o===V?t=V:t!==V&&(t+=(o??"")+n[r+1]),this._$AH[r]=o}a&&!s&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??V)===q)return;const i=this._$AH,s=t===V&&i!==V||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==V&&(i===V||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const at=w.litHtmlPolyfillSupport;at?.(Z,Q),(w.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;class ot extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new Q(e.insertBefore(O(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}ot._$litElement$=!0,ot.finalized=!0,rt.litElementHydrateSupport?.({LitElement:ot});const dt=rt.litElementPolyfillSupport;dt?.({LitElement:ot}),(rt.litElementVersions??=[]).push("4.2.2");const lt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ct={attribute:!0,type:String,converter:f,reflect:!1,hasChanged:y},ht=(t=ct,e,i)=>{const{kind:s,metadata:n}=i;let a=globalThis.litPropertyMetadata.get(n);if(void 0===a&&globalThis.litPropertyMetadata.set(n,a=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),a.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?ht(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}const vt=24,bt=.25,mt="daily_schedule",gt=[{v:0,label:"None"},{v:5/60,label:"±5m"},{v:10/60,label:"±10m"},{v:.25,label:"±15m"},{v:.5,label:"±30m"}],_t={light:"#f5b301",blind:"#7e9cff",water:"#2bc4d4",fan:"#5ad19a",switch:"#a78bfa",climate:"#ff7a66",media:"#e879c9"},ft={light:["light"],blind:["cover"],water:["switch","valve"],fan:["fan"],switch:["switch","input_boolean"],climate:["climate"],media:["media_player"]};function yt(t){return _t[t]??"var(--primary-color)"}function $t(t){const e=Math.round(60*t);return`${String(Math.floor(e/60)%24).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`}function xt(t){const e=/^(\d{1,2}):(\d{2})$/.exec(t.trim());if(!e)return null;const i=+e[1],s=+e[2];return i>24||s>59?null:Math.min(24,i+s/60)}function wt(t,e,i){const s=t[e]?.states;if(!s)return 0!==i;const n=s[i]?.key;return void 0!==n&&"off"!==n}function At(t,e,i){return t[e]?.states[i]?.label??String(i)}function St(t,e){return t[e]?.param_schema??[]}function Et(t){return t.keys??[t.key]}function kt(t,e,i,s,n){const a=s.data?.[n.key];if(void 0!==a)return a;const r=t[e]?.states[i]?.data?.[n.key];return void 0!==r?r:n.default}function Ct(t){return[...t.segments].sort((t,e)=>t.start-e.start)}function Mt(t,e){const i=t.segments.filter(t=>t.id!==e.id),s=i.filter(t=>t.end<=e.start).reduce((t,e)=>Math.max(t,e.end),0),n=i.filter(t=>t.start>=e.end).reduce((t,e)=>Math.min(t,e.start),vt);return{min:s,max:n}}const zt=r`
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
`;let Pt=class extends ot{constructor(){super(...arguments),this._name="",this._targets=[],this._save=()=>{this.dispatchEvent(new CustomEvent("bar-settings-save",{detail:{name:this._name.trim()||this.bar.name,targets:this._targets}}))}}willUpdate(t){t.has("bar")&&(this._name=this.bar.name,this._targets=[...this.bar.targets])}render(){const t={entity:{multiple:!0,filter:{domain:ft[this.bar.type]??[]}}};return W`
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

        <div class="block">
          <div class="field-label">Target entities</div>
          <ha-selector
            .hass=${this.hass}
            .selector=${t}
            .value=${this._targets}
            @value-changed=${t=>this._targets=t.detail.value}
          ></ha-selector>
        </div>

        <div style="display:flex;gap:8px">
          <button class="btn primary" @click=${this._save}>
            <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon> Save
          </button>
        </div>
      </div>
    `}};Pt.styles=[zt,r`
      .popover {
        width: 300px;
      }
      .block {
        margin-bottom: 12px;
      }
      ha-textfield {
        width: 100%;
      }
    `],t([pt({attribute:!1})],Pt.prototype,"hass",void 0),t([pt({attribute:!1})],Pt.prototype,"bar",void 0),t([ut()],Pt.prototype,"_name",void 0),t([ut()],Pt.prototype,"_targets",void 0),Pt=t([lt("ds-bar-settings")],Pt);let Ot=class extends ot{constructor(){super(...arguments),this.scheduleOn=!0,this.conflicts=[],this.now=0,this.syncing=!1,this._editing=null,this._drag=null,this._moved=!1,this._addSegment=()=>{const t=function(t){const e=t.segments.map(t=>[t.start,t.end]).sort((t,e)=>t[0]-e[0]);let i=null,s=0;const n=t=>t?t[1]-t[0]:0;for(const[t,a]of e)t-s>n(i)&&(i=[s,t]),s=Math.max(s,a);if(vt-s>n(i)&&(i=[s,vt]),!i||n(i)<.5)return null;const a=i[0];return{start:a,end:Math.min(i[1],a+Math.max(1,n(i)/2))}}(this.bar);if(!t)return;const e=0===this.bar.base?1:0,i={id:`seg_${Math.random().toString(36).slice(2,10)}`,start:t.start,end:t.end,state:e,jitter:0};this._emit({...this.bar,segments:[...this.bar.segments,i]},!0),this._editing=i.id},this._saveSegment=t=>{const e=t.detail;this._emit({...this.bar,segments:this.bar.segments.map(t=>t.id===e.id?e:t)},!0),this._editing=null},this._deleteSegment=t=>{this._emit({...this.bar,segments:this.bar.segments.filter(e=>e.id!==t.detail)},!0),this._editing=null},this._pickBase=t=>{this._emit({...this.bar,base:t.detail},!0),this._editing=null},this._saveSettings=t=>{this._emit({...this.bar,name:t.detail.name,targets:t.detail.targets},!0),this._editing=null}}get _live(){return this.scheduleOn&&this.bar.enabled}_emit(t,e){this.dispatchEvent(new CustomEvent("bar-change",{detail:{bar:t,commit:e}}))}_dragSeg(t,e,i){i.stopPropagation(),this._moved=!1;const s=Mt(this.bar,t),n=i.clientX,a=t.start,r=t.end;this._drag={id:t.id,mode:e};const o=this.renderRoot.querySelector(".track"),d=i=>{const d=o.getBoundingClientRect().width,l=Math.round((i.clientX-n)/d*vt/bt)*bt;Math.abs(i.clientX-n)>3&&(this._moved=!0);let c={...t};if("move"===e){const e=r-a,i=Math.min(s.max-e,Math.max(s.min,a+l));c={...t,start:i,end:i+e}}else c="l"===e?{...t,start:Math.min(r-bt,Math.max(s.min,a+l))}:{...t,end:Math.max(a+bt,Math.min(s.max,r+l))};this._emit({...this.bar,segments:this.bar.segments.map(e=>e.id===t.id?c:e)},!1)},l=()=>{window.removeEventListener("pointermove",d),window.removeEventListener("pointerup",l),this._drag=null,this._moved&&this._emit(this.bar,!0)};window.addEventListener("pointermove",d),window.addEventListener("pointerup",l)}render(){const t=yt(this.bar.type),e=this.types[this.bar.type],i=Ct(this.bar),s=wt(this.types,this.bar.type,this.bar.base),n=i.find(t=>t.id===this._editing),a=(r=this.bar,o=this.now,Ct(r).find(t=>o>=t.start&&o<t.end));var r,o;return W`
      <div class="bar" style=${`opacity:${this._live?1:.4};--accent:${t}`}>
        <div class="head">
          <div class="icon"><ha-icon icon=${e?.icon??"mdi:calendar"}></ha-icon></div>
          <div class="meta">
            <div class="name">
              ${this.bar.name}
              ${this.conflicts.length?W`<span
                    class="chip"
                    style="color:var(--ds-warn);background:color-mix(in srgb,var(--ds-warn) 14%,transparent)"
                    title=${`Overlaps ${this.conflicts.join(", ")} on a shared entity`}
                  >
                    <ha-icon icon="mdi:alert" style="--mdc-icon-size:12px"></ha-icon> Conflict
                  </span>`:V}
            </div>
            <div class="targets">${this.bar.targets.join(" · ")||"No targets"}</div>
          </div>
          <div class="controls">
            <button
              class="iconbtn"
              title="Bar settings (name & targets)"
              @click=${()=>this._editing="__settings__"}
            >
              <ha-icon icon="mdi:cog-outline" style="--mdc-icon-size:17px"></ha-icon>
            </button>
            <button class="iconbtn" title="Add segment" @click=${this._addSegment}>
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

        <div class="track" @click=${()=>this._editing="__base__"}>
          <div
            class=${"base "+(s?"active":"")}
            title=${`Default: ${At(this.types,this.bar.type,this.bar.base)} — click to change`}
          >
            ${s?W`<span class="base-label"
                  >default: ${At(this.types,this.bar.type,this.bar.base)}</span
                >`:V}
          </div>

          ${i.map(t=>this._renderSegment(t))}

          <div class="now" style=${`left:${this.now/vt*100}%`}></div>

          ${this.syncing&&this._live&&a?W`<div
                class="flash"
                style=${`left:${a.start/vt*100}%;width:${(a.end-a.start)/vt*100}%`}
              ></div>`:V}
          ${this.syncing&&this._live&&!a?W`<div class="flash base-flash"></div>`:V}
        </div>

        ${n?W`<ds-segment-editor
              .hass=${this.hass}
              .segment=${n}
              .type=${this.bar.type}
              .types=${this.types}
              .bounds=${Mt(this.bar,n)}
              .accent=${t}
              @segment-save=${this._saveSegment}
              @segment-delete=${this._deleteSegment}
              @popover-close=${()=>this._editing=null}
            ></ds-segment-editor>`:V}
        ${"__base__"===this._editing?W`<ds-base-popover
              .bar=${this.bar}
              .types=${this.types}
              .accent=${t}
              @base-pick=${this._pickBase}
              @popover-close=${()=>this._editing=null}
            ></ds-base-popover>`:V}
        ${"__settings__"===this._editing?W`<ds-bar-settings
              .hass=${this.hass}
              .bar=${this.bar}
              @bar-settings-save=${this._saveSettings}
              @popover-close=${()=>this._editing=null}
            ></ds-bar-settings>`:V}
      </div>
    `}_renderSegment(t){const e=wt(this.types,this.bar.type,t.state),i=t.start/vt*100,s=(t.end-t.start)/vt*100,n=At(this.types,this.bar.type,t.state),a=e?(r=this.types,o=this.bar.type,d=t,St(r,o).map(t=>{if("media"===t.kind){const t=d.data?.media_title??d.data?.media_content_id;return t?String(t):""}const e=kt(r,o,d.state,d,t);return null==e||""===e?"":"slider"===t.kind?`${Math.round(100*Number(e))}%`:"number"===t.kind?`${e}${t.unit??""}`:String(e)}).filter(Boolean).join(" · ")):"";var r,o,d;const l=e?function(t,e,i){return t[e]?.states[i]?.color??yt(e)}(this.types,this.bar.type,t.state):"",c=this._drag?.id===t.id,h=c&&("move"===this._drag.mode||"l"===this._drag.mode),p=c&&("move"===this._drag.mode||"r"===this._drag.mode),u=`${$t(t.start)}–${$t(t.end)} · ${n}${a?` ${a}`:""}${t.jitter?` · ${function(t){return(gt.find(e=>Math.abs(e.v-t)<.001)??gt[0]).label}(t.jitter)}`:""}`;return W`
      <div
        class=${`seg ${e?"active":"inactive"} ${c?"dragging":""}`}
        style=${`left:${i}%;width:${s}%${l?`;--accent:${l}`:""}`}
        title=${u}
        @pointerdown=${e=>this._dragSeg(t,"move",e)}
        @click=${e=>{e.stopPropagation(),this._moved||(this._editing=t.id)}}
      >
        <div class="handle l" @pointerdown=${e=>this._dragSeg(t,"l",e)}>
          <span></span>
        </div>
        ${s>8?W`<span class="seg-label"
              >${n}${a?W`<span class="seg-sub">${a}</span>`:V}${t.jitter?W`<ha-icon icon="mdi:dice-5" style="--mdc-icon-size:12px"></ha-icon>`:V}</span
            >`:V}
        <div class="handle r" @pointerdown=${e=>this._dragSeg(t,"r",e)}>
          <span></span>
        </div>
        ${h?W`<div class="bubble l">${$t(t.start)}</div>`:V}
        ${p?W`<div class="bubble r">${$t(t.end)}</div>`:V}
      </div>
    `}};Ot.styles=[zt,r`
    .bar {
      margin-bottom: 14px;
      position: relative;
      transition: opacity 0.2s;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 7px;
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
  `],t([pt({attribute:!1})],Ot.prototype,"hass",void 0),t([pt({attribute:!1})],Ot.prototype,"bar",void 0),t([pt({attribute:!1})],Ot.prototype,"types",void 0),t([pt({type:Boolean})],Ot.prototype,"scheduleOn",void 0),t([pt({attribute:!1})],Ot.prototype,"conflicts",void 0),t([pt({type:Number})],Ot.prototype,"now",void 0),t([pt({type:Boolean})],Ot.prototype,"syncing",void 0),t([ut()],Ot.prototype,"_editing",void 0),t([ut()],Ot.prototype,"_drag",void 0),Ot=t([lt("ds-bar")],Ot);let jt=class extends ot{constructor(){super(...arguments),this.accent="",this._si=0,this._start="",this._end="",this._jit=0,this._err="",this._data={},this._close=()=>this.dispatchEvent(new CustomEvent("popover-close")),this._delete=()=>this.dispatchEvent(new CustomEvent("segment-delete",{detail:this.segment.id}))}willUpdate(t){t.has("segment")&&(this._si=this.segment.state,this._start=$t(this.segment.start),this._end=$t(this.segment.end),this._jit=this.segment.jitter??0,this._data={...this.segment.data??{}},this._err="")}get _params(){return wt(this.types,this.type,this._si)?St(this.types,this.type):[]}_setParam(t,e){this._data={...this._data,[t]:e}}_paramNumber(t){const e=kt(this.types,this.type,this._si,{data:this._data},t);return"number"==typeof e?e:Number(e??t.default??0)}_step(t,e){const i=t.step??1;let s=this._paramNumber(t)+e*i;void 0!==t.min&&(s=Math.max(t.min,s)),void 0!==t.max&&(s=Math.min(t.max,s)),s=Math.round(s/i)*i,this._setParam(t.key,Math.round(1e4*s)/1e4)}_save(){const t=xt(this._start),e=xt(this._end);if(null==t||null==e)return this._fail("Use HH:MM");if(e<=t)return this._fail("End must be after start");if(t<this.bounds.min||e>this.bounds.max)return this._fail(`Stay within ${$t(this.bounds.min)}–${$t(this.bounds.max)}`);const i=new Set;for(const t of this._params)for(const e of Et(t))i.add(e);const s={};for(const t of i)void 0!==this._data[t]&&(s[t]=this._data[t]);this.dispatchEvent(new CustomEvent("segment-save",{detail:{...this.segment,state:this._si,start:t,end:e,jitter:this._jit,data:s}}))}_fail(t){this._err=t}render(){const t=this.types[this.type]?.states??[];return W`
      <div class="popover" style="width:268px" @click=${t=>t.stopPropagation()}>
        <div class="popover-head">
          <span>Edit segment</span>
          <button @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
        </div>

        <div class="field-label">State</div>
        <div class="state-buttons" style=${`--accent:${this.accent}`}>
          ${t.map((t,e)=>W`
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

        <div class="row">
          <div>
            <div class="field-label">Start</div>
            <input
              class="time"
              .value=${this._start}
              @input=${t=>{this._start=t.target.value,this._err=""}}
            />
          </div>
          <div>
            <div class="field-label">End</div>
            <input
              class="time"
              .value=${this._end}
              @input=${t=>{this._end=t.target.value,this._err=""}}
            />
          </div>
        </div>
        <div class="hint" style=${"color:"+(this._err?"var(--ds-warn)":"var(--ds-dim)")}>
          ${this._err||`Available ${$t(this.bounds.min)}–${$t(this.bounds.max)}`}
        </div>

        <div class="jitter-head">
          <ha-icon icon="mdi:dice-5" style="--mdc-icon-size:14px"></ha-icon> Daily jitter
          <span class="sub">randomises boundaries ±</span>
        </div>
        <div class="jitter">
          ${gt.map(t=>W`
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
    `}_renderParam(t){return"select"===t.kind?this._renderSelect(t):"slider"===t.kind?this._renderSlider(t):"media"===t.kind?this._renderMedia(t):this._renderStepper(t)}_renderSelect(t){const e=String(kt(this.types,this.type,this._si,{data:this._data},t)??"");return W`
      <div class="field-label" style="margin-top:12px">${t.label}</div>
      <div class="state-buttons" style=${`--accent:${this.accent}`}>
        ${(t.options??[]).map(i=>W`
            <button
              class=${i.value===e?"sel":""}
              @click=${()=>this._setParam(t.key,i.value)}
            >
              ${i.label}
            </button>
          `)}
      </div>
    `}_renderStepper(t){const e=this._paramNumber(t),i=(t.step??1)<1?1:0;return W`
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
    `}_renderSlider(t){const e=this._paramNumber(t);return W`
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
    `}_renderMedia(t){const e={media_content_id:this._data.media_content_id,media_content_type:this._data.media_content_type};return W`
      <div class="field-label" style="margin-top:12px">${t.label}</div>
      <ha-selector
        .hass=${this.hass}
        .selector=${{media:{}}}
        .value=${e}
        @value-changed=${t=>this._onMedia(t.detail.value)}
      ></ha-selector>
    `}_onMedia(t){this._data={...this._data,media_content_id:t?.media_content_id,media_content_type:t?.media_content_type??"music",media_title:t?.metadata?.title}}};jt.styles=[zt,r`
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
    `],t([pt({attribute:!1})],jt.prototype,"hass",void 0),t([pt({attribute:!1})],jt.prototype,"segment",void 0),t([pt()],jt.prototype,"type",void 0),t([pt({attribute:!1})],jt.prototype,"types",void 0),t([pt({attribute:!1})],jt.prototype,"bounds",void 0),t([pt({attribute:!1})],jt.prototype,"accent",void 0),t([ut()],jt.prototype,"_si",void 0),t([ut()],jt.prototype,"_start",void 0),t([ut()],jt.prototype,"_end",void 0),t([ut()],jt.prototype,"_jit",void 0),t([ut()],jt.prototype,"_err",void 0),t([ut()],jt.prototype,"_data",void 0),jt=t([lt("ds-segment-editor")],jt);let Ut=class extends ot{constructor(){super(...arguments),this.accent=""}render(){const t=this.types[this.bar.type]?.states??[];return W`
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
          ${t.map((t,e)=>W`
              <button
                class=${this.bar.base===e?"sel":""}
                @click=${()=>this.dispatchEvent(new CustomEvent("base-pick",{detail:e}))}
              >
                ${t.label}
              </button>
            `)}
        </div>
      </div>
    `}};Ut.styles=[zt],t([pt({attribute:!1})],Ut.prototype,"bar",void 0),t([pt({attribute:!1})],Ut.prototype,"types",void 0),t([pt()],Ut.prototype,"accent",void 0),Ut=t([lt("ds-base-popover")],Ut);let Nt=class extends ot{constructor(){super(...arguments),this._config={type:"custom:daily-schedule-card"},this._entries=[]}setConfig(t){this._config=t}async firstUpdated(){try{const t=await this.hass.callWS({type:`${mt}/list_entries`});this._entries=t.entries}catch{this._entries=[]}}_emit(t){const e={...this._config,...t};this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}render(){return W`
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
          ${this._entries.map(t=>W`<mwc-list-item value=${t.entry_id}>${t.title}</mwc-list-item>`)}
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
    `}};Nt.styles=r`
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
  `,t([pt({attribute:!1})],Nt.prototype,"hass",void 0),t([ut()],Nt.prototype,"_config",void 0),t([ut()],Nt.prototype,"_entries",void 0),Nt=t([lt("ds-editor")],Nt);const Tt=()=>{const t=new Date;return t.getHours()+t.getMinutes()/60+t.getSeconds()/3600};let Ht=class extends ot{constructor(){super(...arguments),this._types={},this._now=Tt(),this._syncing=!1,this._menuOpen=!1,this._connecting=!1,this._onBarChange=(t,e)=>{this._schedule&&(this._schedule={...this._schedule,bars:this._schedule.bars.map(e=>e.id===t.id?t:e)},e&&this._ws("update_bar",{bar_id:t.id,bar:t}))}}static getConfigElement(){return document.createElement("ds-editor")}static getStubConfig(){return{entry_id:""}}setConfig(t){this._config=t,this._entryId=t.entry_id||void 0,this._connectedEntry&&this._connectedEntry!==this._entryId&&this._teardown()}connectedCallback(){super.connectedCallback(),this._nowTimer=window.setInterval(()=>this._now=Tt(),3e4),this._maybeConnect()}disconnectedCallback(){super.disconnectedCallback(),this._nowTimer&&window.clearInterval(this._nowTimer),this._teardown()}updated(){this._maybeConnect()}async _maybeConnect(){if(this.hass&&!this._connectedEntry&&!this._connecting){this._connecting=!0;try{await this._connect()}finally{this._connecting=!1}}}async _connect(){if(!this._entryId)try{const t=await this.hass.callWS({type:`${mt}/list_entries`});if(this._types=t.types,1!==t.entries.length)return 0===t.entries.length?void(this._error="No Daily Schedule is set up. Add the integration first."):void(this._error="Multiple schedules found — set entry_id in the card config.");this._entryId=t.entries[0].entry_id}catch(t){return void(this._error=`Could not reach Daily Schedule: ${t}`)}this._connectedEntry=this._entryId,this._error=void 0;try{this._unsub=this.hass.connection.subscribeMessage(t=>{this._schedule=t},{type:`${mt}/subscribe`,entry_id:this._entryId});const t=await this.hass.callWS({type:`${mt}/get`,entry_id:this._entryId});this._types=t.types,this._schedule=t}catch(t){this._error=`Could not load schedule: ${t}`,this._connectedEntry=void 0}}_teardown(){this._unsub?.then(t=>t()).catch(()=>{}),this._unsub=void 0,this._connectedEntry=void 0,this._schedule=void 0}async _ws(t,e={}){try{await this.hass.callWS({type:`${mt}/${t}`,entry_id:this._entryId,...e})}catch(e){this._error=`${t} failed: ${e}`}}_setEnabled(t){this._schedule&&(this._schedule={...this._schedule,enabled:t}),this._ws("set_enabled",{enabled:t})}async _syncNow(){this._schedule?.enabled&&(this._syncing=!0,await this._ws("sync_now"),window.setTimeout(()=>this._syncing=!1,1400))}_addBar(t){this._menuOpen=!1,this._ws("add_bar",{bar:{name:"New schedule",type:t,targets:[],base:0,enabled:!0,segments:[{start:8,end:18,state:1,jitter:0}]}})}render(){if(this._error)return this._card(W`<div class="error">${this._error}</div>`);if(!this._schedule)return this._card(W`<div class="loading">Loading…</div>`);const t=this._schedule,e=t.bars.length,i=this._config?.title??"Daily Schedule";return this._card(W`
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
          ${[0,6,12,18,24].map(t=>W`<span
              class="tick"
              style=${`left:${t/vt*100}%;transform:${0===t?"none":24===t?"translateX(-100%)":"translateX(-50%)"}`}
              >${$t(t)}</span
            >`)}
          <span class="now-label" style=${`left:${this._now/vt*100}%`}>${$t(this._now)}</span>
        </div>

        <div class="bars">
          <div class="gridlines">
            ${[6,12,18].map(t=>W`<div class="gl" style=${`left:${t/vt*100}%`}></div>`)}
          </div>
          ${t.bars.map(e=>W`
              <ds-bar
                .hass=${this.hass}
                .bar=${e}
                .types=${this._types}
                .scheduleOn=${t.enabled}
                .conflicts=${t.conflicts?.[e.id]??[]}
                .now=${this._now}
                .syncing=${this._syncing}
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
          ${this._menuOpen?W`<div class="menu">
                ${Object.entries(this._types).map(([t,e])=>W`
                    <button @click=${()=>this._addBar(t)}>
                      <ha-icon icon=${e.icon} style=${`color:${yt(t)}`}></ha-icon>
                      <span class="cap">${t}</span>
                      <span class="states">${e.states.map(t=>t.label).join(" / ")}</span>
                    </button>
                  `)}
              </div>`:V}
        </div>
      </div>

      <div class="footer">
        Striped/plain fill = default state (click to change) · tap a segment to edit state, times
        &amp; jitter · drag to move or resize · per-bar toggle on the right
      </div>
    `)}_card(t){return W`<ha-card>${t}</ha-card>`}getCardSize(){return 3+(this._schedule?.bars.length??1)}};Ht.styles=[zt,r`
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
  `],t([pt({attribute:!1})],Ht.prototype,"hass",void 0),t([ut()],Ht.prototype,"_config",void 0),t([ut()],Ht.prototype,"_schedule",void 0),t([ut()],Ht.prototype,"_types",void 0),t([ut()],Ht.prototype,"_entryId",void 0),t([ut()],Ht.prototype,"_error",void 0),t([ut()],Ht.prototype,"_now",void 0),t([ut()],Ht.prototype,"_syncing",void 0),t([ut()],Ht.prototype,"_menuOpen",void 0),Ht=t([lt("daily-schedule-card")],Ht),window.customCards=window.customCards||[],window.customCards.push({type:"daily-schedule-card",name:"Daily Schedule",description:"Build a repeating 24-hour schedule that drives your entities.",preview:!1});export{Ht as DailyScheduleCard};

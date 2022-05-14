const { GLib, GObject, Gio, Clutter } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const { Prefs } = Me.imports.conveniences.settings;
const { Keys } = Me.imports.conveniences.keys;

const Preferences = new Prefs(Keys);

// new Clutter Shader Effect that simply mixes a color in, The class applies the GLSL shader programmed into
// vfunc_get_static_shader_source and applies it to an Actor
// 
// Clutter Shader Source Code https://github.com/GNOME/clutter/blob/master/clutter/clutter-shader-effect.c
// GJS Doc https://gjs-docs.gnome.org/clutter10~10_api/clutter.shadereffect


function BlurEffect(height, width) {

	let blur = Clutter.ShaderEffect.new(0);
	
blur.set_shader_source(`
  uniform sampler2D tex;					
  uniform float sigma;                                                      
uniform float pixel_step;                                                 
vec2 direction = vec2(2.0,1.0);                                                   



 void main (){						

   vec2 uv = vec2 (cogl_tex_coord_in[0]);                                    
                                                                          
   vec3 gauss_coefficient;                                                
   gauss_coefficient.x = 1.0 / (sqrt (2.0 * 3.14159265) * sigma);         
   gauss_coefficient.y = exp (-0.5 / (sigma * sigma));                    
   gauss_coefficient.z = gauss_coefficient.y * gauss_coefficient.y;       
                                                                          
   float gauss_coefficient_total = gauss_coefficient.x;                   
                                                                          
   vec4 ret = texture2D (cogl_sampler, uv) * gauss_coefficient.x;         
   gauss_coefficient.xy *= gauss_coefficient.yz;                          
                                                                          
   int n_steps = int (ceil (1.5 * sigma)) * 2;                            
                                                                          
   for (int i = 1; i <= n_steps; i += 2) {                                
     float coefficient_subtotal = gauss_coefficient.x;                    
     gauss_coefficient.xy *= gauss_coefficient.yz;                        
     coefficient_subtotal += gauss_coefficient.x;                         
                                                                          
     float gauss_ratio = gauss_coefficient.x / coefficient_subtotal;      
                                                                          
     float foffset = float (i) + gauss_ratio;                             
     vec2 offset = direction * foffset * pixel_step;                      
                                                                          
     ret += texture2D (cogl_sampler, uv + offset) * coefficient_subtotal; 
     ret += texture2D (cogl_sampler, uv - offset) * coefficient_subtotal; 
                                                                          
     gauss_coefficient_total += 2.0 * coefficient_subtotal;               
     gauss_coefficient.xy *= gauss_coefficient.yz;                        
   }                                                                      
                                                                          
   cogl_texel = ret / gauss_coefficient_total;                            
    

  
     
      }

`); 

/*blur.set_shader_source(`
uniform sampler2D tex;					
//uniform float x_step, y_step;
//uniform float brightness, contrast;
uniform float x_step;
uniform float y_step;
float brightness = 1.6;
float radius = 5.0;

define SAMPLE(offx, offy) {
  cogl_texel += texture2D (cogl_sampler, cogl_tex_coord.st + pixel_step *  
  vec2 ( G_STRINGIFY (offx) ,  G_STRINGIFY (offy) ));
  }

uniform vec2 pixel_step;
void main (){						
  cogl_texel = texture2D (cogl_sampler, cogl_tex_coord.st);

  SAMPLE (-1.0, -1.0);
  SAMPLE ( 0.0, -1.0);
  SAMPLE (+1.0, -1.0);
  SAMPLE (-1.0,  0.0);
  SAMPLE (+1.0,  0.0);
  SAMPLE (-1.0, +1.0);
  SAMPLE ( 0.0, +1.0);
  SAMPLE (+1.0, +1.0);
  cogl_texel /= 9.0;


  // cogl_color_out = color;    
  //    cogl_color_out = cogl_color_out * cogl_color_in; 
    }

`); */

blur.set_uniform_value("pixel_step", 1.0/height);
blur.set_uniform_value("sigma", 1.0 );


return blur;
}

var Bl4urEffect = new GObject.registerClass({
  GTypeName: "Blur_Effect",

}, class BlurShader extends Clutter.ShaderEffect {

  _init(params = {}) {


    super._init(params);


    this.new(Clutter.ShaderType.FRAGMENT_SHADER);

    this.set_shader_source(`
//"in" attributes from our vertex shader
varying vec4 vColor;
varying vec2 vTexCoord;

//declare uniforms
uniform sampler2D u_texture;
uniform float resolution;
uniform float radius;
uniform vec2 dir;

void main() {
    //this will be our RGBA sum
    vec4 sum = vec4(0.0);
    
    //our original texcoord for this fragment
    vec2 tc = vTexCoord;
    
    //the amount to blur, i.e. how far off center to sample from 
    //1.0 -> blur by one pixel
    //2.0 -> blur by two pixels, etc.
    float blur = radius/resolution; 
    
    //the direction of our blur
    //(1.0, 0.0) -> x-axis blur
    //(0.0, 1.0) -> y-axis blur
    float hstep = dir.x;
    float vstep = dir.y;
    
    //apply blurring, using a 9-tap filter with predefined gaussian weights
    
    sum += texture2D(u_texture, vec2(tc.x - 4.0*blur*hstep, tc.y - 4.0*blur*vstep)) * 0.0162162162;
    sum += texture2D(u_texture, vec2(tc.x - 3.0*blur*hstep, tc.y - 3.0*blur*vstep)) * 0.0540540541;
    sum += texture2D(u_texture, vec2(tc.x - 2.0*blur*hstep, tc.y - 2.0*blur*vstep)) * 0.1216216216;
    sum += texture2D(u_texture, vec2(tc.x - 1.0*blur*hstep, tc.y - 1.0*blur*vstep)) * 0.1945945946;
    
    sum += texture2D(u_texture, vec2(tc.x, tc.y)) * 0.2270270270;
    
    sum += texture2D(u_texture, vec2(tc.x + 1.0*blur*hstep, tc.y + 1.0*blur*vstep)) * 0.1945945946;
    sum += texture2D(u_texture, vec2(tc.x + 2.0*blur*hstep, tc.y + 2.0*blur*vstep)) * 0.1216216216;
    sum += texture2D(u_texture, vec2(tc.x + 3.0*blur*hstep, tc.y + 3.0*blur*vstep)) * 0.0540540541;
    sum += texture2D(u_texture, vec2(tc.x + 4.0*blur*hstep, tc.y + 4.0*blur*vstep)) * 0.0162162162;

    gl_FragColor = vColor * sum;
}
  `);

  }


  vfunc_paint_target(paint_node = null, paint_context = null) {
    this.set_uniform_value("tex", 0);

    if (paint_node && paint_context)
      super.vfunc_paint_target(paint_node, paint_context);
    else if (paint_node) super.vfunc_paint_target(paint_node);
    else super.vfunc_paint_target();
  }
});
















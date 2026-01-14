import { useEffect, useRef, memo } from 'react'

/**
 * Sunset Background
 *
 * WebGL shader-based sunset scene with water reflections
 * Inspired by Buttermax's interactive WebGL sunset
 * Features: sky gradient, sun glow, animated waves, reflections, clouds
 */

const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;
void main() {
  gl_Position = position;
}`

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 resolution;
uniform float time;

#define PI 3.14159265359
#define ITER_GEOMETRY 3
#define ITER_FRAGMENT 5
#define SEA_HEIGHT 0.5
#define SEA_CHOPPY 2.0
#define SEA_SPEED 0.3
#define SEA_FREQ 0.12
#define EPSILON_NRM 0.001

// Hash functions
float hash(vec2 p) {
  float h = dot(p, vec2(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return -1.0 + 2.0 * mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Sea octave - creates wave pattern
float sea_octave(vec2 uv, float choppy) {
  uv += noise(uv);
  vec2 wv = 1.0 - abs(sin(uv));
  vec2 swv = abs(cos(uv));
  wv = mix(wv, swv, wv);
  return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
}

// Get sea height at position
float map(vec3 p) {
  float freq = SEA_FREQ;
  float amp = SEA_HEIGHT;
  float choppy = SEA_CHOPPY;
  vec2 uv = p.xz;

  float d, h = 0.0;
  for (int i = 0; i < ITER_GEOMETRY; i++) {
    d = sea_octave((uv + time * SEA_SPEED) * freq, choppy);
    d += sea_octave((uv - time * SEA_SPEED) * freq, choppy);
    h += d * amp;
    uv *= mat2(1.6, 1.2, -1.2, 1.6);
    freq *= 1.9;
    amp *= 0.22;
    choppy = mix(choppy, 1.0, 0.2);
  }
  return p.y - h;
}

// High detail height for normals
float map_detailed(vec3 p) {
  float freq = SEA_FREQ;
  float amp = SEA_HEIGHT;
  float choppy = SEA_CHOPPY;
  vec2 uv = p.xz;

  float d, h = 0.0;
  for (int i = 0; i < ITER_FRAGMENT; i++) {
    d = sea_octave((uv + time * SEA_SPEED) * freq, choppy);
    d += sea_octave((uv - time * SEA_SPEED) * freq, choppy);
    h += d * amp;
    uv *= mat2(1.6, 1.2, -1.2, 1.6);
    freq *= 1.9;
    amp *= 0.22;
    choppy = mix(choppy, 1.0, 0.2);
  }
  return p.y - h;
}

// Calculate normal from height
vec3 getNormal(vec3 p, float eps) {
  vec3 n;
  n.y = map_detailed(p);
  n.x = map_detailed(vec3(p.x + eps, p.y, p.z)) - n.y;
  n.z = map_detailed(vec3(p.x, p.y, p.z + eps)) - n.y;
  n.y = eps;
  return normalize(n);
}

// Heightmap tracing
float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
  float tm = 0.0;
  float tx = 1000.0;
  float hx = map(ori + dir * tx);
  if (hx > 0.0) {
    p = ori + dir * tx;
    return tx;
  }
  float hm = map(ori + dir * tm);
  float tmid = 0.0;
  for (int i = 0; i < 8; i++) {
    tmid = mix(tm, tx, hm / (hm - hx));
    p = ori + dir * tmid;
    float hmid = map(p);
    if (hmid < 0.0) {
      tx = tmid;
      hx = hmid;
    } else {
      tm = tmid;
      hm = hmid;
    }
  }
  return tmid;
}

// Sun position - half submerged in horizon
const vec3 sunDir = normalize(vec3(0.0, -0.02, 1.0));
const float sunRadius = 0.045;

// Sky gradient - soft peachy sunset with warm sun (no white)
vec3 getSkyColor(vec3 e) {
  e.y = max(e.y, 0.0);

  // Soft gradient: blue top -> peachy pink -> warm orange at horizon
  vec3 topColor = vec3(0.45, 0.55, 0.70);     // Soft blue-gray
  vec3 midColor = vec3(0.70, 0.55, 0.60);     // Muted peachy pink
  vec3 horizonColor = vec3(0.85, 0.60, 0.50); // Warm peach

  vec3 col;
  if (e.y > 0.3) {
    col = mix(midColor, topColor, (e.y - 0.3) / 0.7);
  } else {
    col = mix(horizonColor, midColor, e.y / 0.3);
  }

  // Sun disc - warm orange, no white
  float sunDist = length(e - sunDir);

  // Core sun disc - warm orange/gold, not white
  float sunDisc = smoothstep(sunRadius, sunRadius * 0.6, sunDist);
  vec3 sunColor = vec3(1.0, 0.65, 0.35); // Warm orange sun

  // Soft inner glow - orange, reduced intensity
  float innerGlow = exp(-sunDist * 20.0) * 0.5;
  vec3 innerGlowColor = vec3(1.0, 0.55, 0.30);

  // Middle glow - warm orange halo, subtle
  float midGlow = exp(-sunDist * 6.0) * 0.3;
  vec3 midGlowColor = vec3(0.95, 0.50, 0.25);

  // Outer glow - very subtle atmospheric
  float outerGlow = exp(-sunDist * 2.5) * 0.15;
  vec3 outerGlowColor = vec3(0.90, 0.45, 0.25);

  // Combine sun layers - all warm tones, no white
  col = mix(col, sunColor, sunDisc * 0.8);
  col += innerGlowColor * innerGlow;
  col += midGlowColor * midGlow;
  col += outerGlowColor * outerGlow;

  return col;
}

// Sea color with depth and subtle sun reflection (no white glare)
vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
  // Soft blue-teal water colors
  vec3 baseColor = vec3(0.15, 0.22, 0.30);
  vec3 waterColor = vec3(0.25, 0.35, 0.42);

  float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
  fresnel = pow(fresnel, 3.0) * 0.5;

  vec3 reflected = getSkyColor(reflect(eye, n));
  vec3 refracted = baseColor + waterColor * (p.y - SEA_HEIGHT) * 0.15;

  vec3 color = mix(refracted, reflected, fresnel);

  // Soft diffuse lighting from sun - warm tones
  float diffuse = clamp(dot(n, l), 0.0, 1.0) * 0.4 + 0.6;
  color *= diffuse * vec3(0.95, 0.88, 0.82);

  // Sun reflection on water - warm orange, no white
  vec3 reflectedSunDir = reflect(eye, n);
  float sunReflDist = length(reflectedSunDir - sunDir);

  // Primary sun reflection - warm orange, reduced intensity
  float sunSpec = exp(-sunReflDist * 30.0) * 0.5;
  color += vec3(1.0, 0.60, 0.30) * sunSpec;

  // Sun glitter path - subtle warm glow
  float glitterPath = exp(-sunReflDist * 12.0) * 0.25;
  color += vec3(0.95, 0.55, 0.30) * glitterPath;

  // Wider sun glow on water - very subtle
  float waterGlow = exp(-sunReflDist * 4.0) * 0.12;
  color += vec3(0.90, 0.50, 0.30) * waterGlow;

  // Subsurface scattering - subtle blue-green
  float sss = pow(clamp(1.0 + dot(n, eye), 0.0, 1.0), 3.0);
  color += vec3(0.12, 0.22, 0.28) * sss * 0.1;

  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 coord = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  // Camera setup - looking at ocean
  float camHeight = 3.5;
  vec3 ori = vec3(0.0, camHeight, time * 0.15);
  vec3 ang = vec3(0.0, -0.15, 0.0);

  // Create ray direction
  vec3 dir;
  dir.xy = coord;
  dir.z = 2.0;
  dir = normalize(dir);

  // Tilt camera down slightly
  float c = cos(ang.y), s = sin(ang.y);
  dir = vec3(dir.x, c * dir.y - s * dir.z, s * dir.y + c * dir.z);

  vec3 color;

  // Trace ocean surface
  vec3 p;
  heightMapTracing(ori, dir, p);
  vec3 dist = p - ori;
  vec3 n = getNormal(p, dot(dist, dist) * EPSILON_NRM);

  // Blend sky and sea based on ray direction
  if (dir.y > 0.05) {
    // Looking at sky
    color = getSkyColor(dir);
  } else if (dir.y > -0.05) {
    // Horizon blend zone
    vec3 skyCol = getSkyColor(dir);
    vec3 seaCol = getSeaColor(p, n, sunDir, dir, dist);
    float blend = smoothstep(-0.05, 0.05, dir.y);
    color = mix(seaCol, skyCol, blend);
  } else {
    // Looking at sea
    color = getSeaColor(p, n, sunDir, dir, dist);
  }

  // Atmospheric perspective - soften distant areas
  float fogAmount = 1.0 - exp(-length(dist) * 0.001);
  vec3 fogColor = vec3(0.65, 0.55, 0.55);
  color = mix(color, fogColor, fogAmount * 0.25);

  // Subtle vignette
  float vignette = 1.0 - length(uv - 0.5) * 0.35;
  color *= vignette;

  // Tone mapping - prevent white blowout, keep warm tones
  color = color / (1.0 + color * 0.4);

  // Clamp to prevent any pure white
  color = min(color, vec3(0.95, 0.85, 0.80));

  fragColor = vec4(color, 1.0);
}`

const SunsetBackground = memo(function SunsetBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const glRef = useRef<WebGL2RenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2')
    if (!gl) {
      console.error('WebGL2 not supported')
      return
    }
    glRef.current = gl

    // Compile shader
    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    programRef.current = program

    // Create fullscreen quad
    const vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    // Resize handler
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    // Animation loop
    const render = () => {
      if (!glRef.current || !programRef.current) return

      const gl = glRef.current
      const program = programRef.current
      const time = (Date.now() - startTimeRef.current) * 0.001

      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      const resolutionLoc = gl.getUniformLocation(program, 'resolution')
      const timeLoc = gl.getUniformLocation(program, 'time')

      gl.uniform2f(resolutionLoc, canvas.width, canvas.height)
      gl.uniform1f(timeLoc, time)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (program) {
        gl.deleteProgram(program)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: '#1a2a3a' }}
    />
  )
})

export default SunsetBackground

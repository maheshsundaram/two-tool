import { useEffect, useRef, useState } from 'react';
import './App.css';
import SolutionCard from './components/solutionCard';
import { Alert, Box, Button, Card, CardContent, CssVarsProvider, FormControl, FormHelperText, FormLabel, Grid, IconButton, Input, Link, Radio, RadioGroup, Sheet, Stack, Typography} from '@mui/joy';
import { extendTheme, useTheme } from '@mui/joy/styles';
import { getSolutions } from './util/solver';
import MethodPicker from './components/methodPicker';
import FaceColorButton from './components/FaceColorButton';
import ViewListIcon from '@mui/icons-material/ViewList';
import GitHubIcon from '@mui/icons-material/GitHub';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import Search from '@mui/icons-material/Search';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import AlgSorter from './util/algSorter';
import SkeletonSolutionCard from './components/skeletonSolutionCard';
import HelpModal from './components/helpModal';
import { useNavigate } from 'react-router-dom';
import { AwsRum } from 'aws-rum-web';

let awsRum = null;
try {
  const config = {
    sessionSampleRate: 1,
    identityPoolId: "us-east-2:6baa256c-694f-46d9-8c4b-abed70a26e7d",
    endpoint: "https://dataplane.rum.us-east-2.amazonaws.com",
    telemetries: [],
    allowCookies: false,
    enableXRay: false
  };

  const APPLICATION_ID = 'ddf82aa2-85b8-4b0c-9a68-d049fe3641f4';
  const APPLICATION_VERSION = '1.0.0';
  const APPLICATION_REGION = 'us-east-2';

  awsRum = new AwsRum(
    APPLICATION_ID,
    APPLICATION_VERSION,
    APPLICATION_REGION,
    config
  );
} catch (error) {
  console.log(error);
  // Ignore errors thrown during CloudWatch RUM web client initialization
}

function App() {
  const [algSorter, setAlgSorter] = useState(undefined);
  const [solutions, setSolutions] = useState([]);
  const [scramble, setScramble] = useState('');
  const [imageScramble, setImageScramble] = useState('');
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const workerRef = useRef();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(
    () => {
      const saved = localStorage.getItem("selected");
      const initialValue = JSON.parse(saved);
      return initialValue || {
        'CLL': true,
        'EG-1': true,
        'EG-2': true,
        'LEG-1': false,
        'TCLL+': false,
        'TCLL-': false,
        'LS1': false,
        'LS2': false,
        'LS3': false,
        'LS4': false,
        'LS5': false,
        'LS6': false,
        'LS7': false,
        'LS8': false,
        'LS9': false
      };
    }
    );
  
  const [checkedColorList, setCheckedColorList] = useState({white: true, blue: true, green: true, orange: true, red: true, yellow: true});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const colorClick = (b, color) => {
    setCheckedColorList({
      ...checkedColorList,
      [color]: b
    });
  };

    const defaultDepths = {
      "EG": 5,
      "TCLL": 4,
      "LS": 3,
      "ALG": 1
  };

  const [shouldUpdate, setShouldUpdate] = useState(false);
  const [depths, setDepths] = useState(
    () => {
      const saved = localStorage.getItem("depths");
      const initialValue = JSON.parse(saved);
      return initialValue || defaultDepths;
    }
  );

  const solve = async (scramble) => {
    worker.postMessage(JSON.stringify({ scramble: scramble, 
      egDepth: depths['EG'], 
      tcllDepth: depths['TCLL'], 
      lsDepth: depths['LS']
    }));
    awsRum.recordEvent(
      'search', 
      {
          scramble: scramble
      })
  };

  const receiveWorker = (message) => {
    let workerResponse = JSON.parse(message.data);
    workerResponse.sort((a, b) => algSorter.getScore(a) - algSorter.getScore(b));
    let prev;
    workerResponse = workerResponse.filter(elem => {
      if ((elem.shouldDelete) || (prev && (elem.color === prev.color) && (elem.alg === prev.alg) && (elem.face === prev.face))) {
          return false;
      } else {
          prev = elem;
          return true;
      }
    });
    setShouldUpdate(false);
    setLoading(false);
    setSolutions(workerResponse);

  }

  const worker = new Worker("worker.js");
  worker.addEventListener('message', receiveWorker);

  const setDepth = (group, depth) => {
    const d = 
        {
            ...depths,
            [group]: depth
        }
    ;

    localStorage.setItem('depths', JSON.stringify(d));
    setDepths(d);
  }

  const setDepthAndSearch = (group, depth) => {
    const d =
      {
          ...depths,
          [group]: depth
      }
    ;
    localStorage.setItem('depths', JSON.stringify(d));
    setDepths(d)
    if (imageScramble) {
      setShouldUpdate(true);
    }
  }

  useEffect(() => {
    if (!algSorter)
      setAlgSorter(new AlgSorter());
  }, []);


  useEffect(() => {
    if (shouldUpdate) {
      setLoading(true);
      setShouldUpdate(false);
      const fetchData = async () => {
        const x = await solve(imageScramble.replaceAll("’", "'"));
      }
      if (imageScramble)
      fetchData()
        .catch(console.error);
    }
  }, [shouldUpdate]);
  
  const click = (method) => {
    selected[method] = !selected[method];
    localStorage.setItem("selected", JSON.stringify(selected))
    setSelected({ ...selected });
  };

  const updateScramble = (e) => {
    const scram = e.target.value.trim();
    const re = (/^([RUF][2'’]? )*([RUF][2'’]?)$/).test(scram);
    setScramble(scram);
    setError(!re && (scram.length > 0));
  }

  const submitScramble = () => {
    if (scramble.length > 0) {
      const newScram = scramble.replaceAll("’", "'");
      setImageScramble(newScram);
      // navigate(`/?alg=${newScram}`);
      setSubmitted(true);
      setLoading(true);
      setShouldUpdate(true);
    }
  };


  const getVars = (color) => {
    return {
      solidColor: `#fff`,
      solidBg: `var(--joy-palette-${color}-500)`,
      solidActiveBg: `var(--joy-palette-${color}-500)`,
      outlinedBorder: `var(--joy-palette-${color}-600)`,
      outlinedColor: `var(--joy-palette-${color}-700)`,
      outlinedActiveBg: `var(--joy-palette-${color}-100)`,
      softColor: `var(--joy-palette-${color}-800)`,
      softBg: `var(--joy-palette-${color}-200)`,
      softActiveBg: `var(--joy-palette-${color}-300)`,
      plainColor: `white`,
      plainActiveBg: `var(--joy-palette-${color}-100)`, 
    }
  }
  const appTheme = extendTheme({
    typography: {
      h0: {
        background: 'var(--joy-palette-blue-700)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      },
    },
    colorSchemes: {
      light: {
        palette: {
          theme1: "#5EA0FD",
          blue: {
            50: "#e2f2ff",
            100: "#baddff",
            200: "#8cc8ff",
            300: "#5ab2ff",
            400: "#30a1ff",
            500: "#0090ff",
            600: "#1482ff",
            700: "#1e6fea",
            800: "#225dd8",
            900: "#263bb8",
            ...(getVars("blue"))
          },
          green: {
            50: "#effee7",
            100: "#d7fbc4",
            200: "#bbf89d",
            300: "#9af46f",
            400: "#7cf046",
            500: "#5bec00",
            600: "#47da00",
            700: "#1dc400",
            800: "#00b000",
            900: "#008c00",
            ...(getVars("green"))
          },
          red: {
            50: "#ffebee",
            100: "#ffcdd2",
            200: "#ef999b",
            300: "#e57274",
            400: "#ef5152",
            500: "#f43f38",
            600: "#e53637",
            700: "#d32b31",
            800: "#c6242a",
            900: "#b7171e",
            ...(getVars("red"))
          },
          orange: {
            50: "#fff9e5",
            100: "#ffedbe",
            200: "#ffe295",
            300: "#ffd96f",
            400: "#ffce58",
            500: "#ffc751",
            600: "#ffba4c",
            700: "#fda847",
            800: "#fa9945",
            900: "#f57f40",
            ...(getVars("orange")),
            solidBg: 'var(--joy-palette-orange-800)'
          },
          yellow: {
            "50": "#feffe7",
            "100": "#fbfdc0",
            "200": "#f7fa94",
            "300": "#f2f764",
            "400": "#edf337",
            "500": "#fbff0a",
            "600": "#fceb00",
            "700": "#ffd100",
            "800": "#ffb800",
            "900": "#ff8b00",
            ...(getVars("yellow")),
            solidColor: '#000',
          },
          white: {
            50: "#c2c2c2",
            100: "#dedede",
            200: "#f0f0f0",
            300: "#f5f5f5",
            400: "#fafafa",
            500: "#ffffff",
            600: "#ffffff",
            700: "#ffffff",
            800: "#ffffff",
            900: "#ffffff",
            ...(getVars("white")),
            solidColor: "#000"
          }
        }
      },
      "dark": {
        palette: {
          blue: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#76a8fa",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d"
          },
          green: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d"
          },
          red: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d"
          },
          orange: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d"
          },
          yellow: {
            solidBg: "#ef4444",
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d"
          },
          white: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d"
          }
        }
      }
    }
  });
  
  return (
    <CssVarsProvider theme={appTheme} defaultMode='light'>
      <Sheet sx={{ overflow: 'hidden', height: '100vh', width: '100vw' }}>
        <HelpModal open={open} setOpen={setOpen}></HelpModal>
        <Stack direction="column" sx={{ overflow: 'hidden', height: '100vh', maxWidth: '100vw', overflow: 'hidden' }}>
            <Sheet variant="outlined" sx={{marginBottom: '10px', boxShadow: 'sm', borderTop:'0', borderLeft: '0', borderRight: '0', backgroundColor: '', height: '50px'}}>
            <Grid container spacing={3} height="100%" margin={0} sx={{ flexGrow: 1 }}>
              <Grid id="headerIconContainer" xs alignItems="center" display="flex" flexDirection="row" padding={0} paddingLeft={1}>
                  <ViewInArIcon color="primary"/>
                  {/* <Typography>Will Callan</Typography> */}
              </Grid>
              <Grid xs={6} padding={0} margin={0} maxHeight="100%">
                <Stack id="headerTitleContainer" height="100%" direction="row" justifyContent="center">
                  <Typography id="headerTitle" alignSelf="center" level="h2" sx={(theme) => theme.typography.h0}>Two-Tools</Typography>
                </Stack>
              </Grid>
              <Grid xs maxHeight="100%" sx={{padding: '0'}}>
                <Stack height="100%" paddingTop={0} paddingBottom={0} paddingRight={1} direction="row" spacing={1} justifyContent="end" alignItems="center">
                    <Link
                      href="https://docs.google.com/spreadsheets/d/1OFXakCV85Mp2zsQBXMxiMX9a506JeAcLnUXZr8FgXAY/edit?usp=sharing"
                      alignSelf="center"
                      underline="none"
                      variant="soft"
                      color="primary"
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ '--Link-gap': '0.5rem', pl: 1, pr: 1, py: 0.5, borderRadius: 'md' }}
                    >
                      Algorithms
                    </Link>
                    <Link
                      href="https://github.com/WACWCA/two-tool"
                      target="_blank" 
                      rel="noopener noreferrer"
                      alignSelf="center"
                      underline="none"
                      variant="outlined"
                      color="neutral"
                      sx={{borderRadius: 'md', boxSizing:"border-box", maxHeight: '32px', minHeight: '32px',  pl: 1, pr: 1, py: 0.5, borderRadius: 'md'}}
                    ><GitHubIcon /></Link>
                    <Link
                      href=""
                      alignSelf="center"
                      underline="none"
                      variant="outlined"
                      color="neutral"
                      component="button"
                      sx={{ py:0.5, px:1, borderRadius: 'md', height: '32px'}}
                      onClick={() => setOpen(true)}
                    ><QuestionMarkIcon /></Link>
                    
                  </Stack>      
                  
              </Grid>
            </Grid>
            </Sheet>  
          <Stack direction="row" flexWrap="wrap" justifyContent="center" spacing={1} sx={{overflow: 'hidden', overflowY: 'auto', maxHeight: '100%'}}>
            <Stack direction="column">
              <Card sx={{padding:'0px', border: '0'}}>
                <Box height={"35px"} padding={0} display="flex" flexDirection="column" alignItems="center">
                  {imageScramble && 
                  <>
                    <Typography level='body-xs' lineHeight="1">Scramble</Typography>
                    <Typography lineHeight="1">{imageScramble}</Typography>           
                  </>
                  }
                       
                </Box>
              </Card>
              <Box><twisty-player hint-facelets='floating' background='none' control-panel='none' alg={imageScramble} puzzle="2x2x2"></twisty-player></Box>
              <Stack variant='outlined' justifyContent="center" sx={{py: 0, display: 'flex', borderRadius: '0'}} >
                <Link  level='body-xs' marginTop={1} marginBottom={1} color="neutral" variant='outlined' textColor="primary" href="https://js.cubing.net/cubing/" target="_blank" 
                      rel="noopener noreferrer" alignSelf="center"                       sx={{ opacity: '0.5', '--Link-gap': '0.5rem', pl: 1, pr: 1, py: 0.5, borderRadius: 'md' }}
                      >
                     twisty-player by Lucas Garron</Link></Stack>
            </Stack>
            <Box id="rightCol" display="flex" justifyContent="center" sx={{overflowY: 'auto', maxHeight: '100%'}}>
            <Stack alignItems="center" paddingLeft={1} paddingRight={2} spacing={1} overflow="hidden" direction="column" sx={{
              // height: '100%'
              maxHeight:'100%',
              maxWidth:'360px',
              minWidth: '300px',
              width: "100%"
            }}>
              <Card 
                sx={{
                paddingBottom: "0px",
                backgroundColor: "background.level1",
                boxShadow: 'md',
                width: "100%",
                maxWidth:'360px',
                minWidth: '300px',
                boxSizing: 'border-box'
                }}>
                <Stack direction="column" spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <Input error={error} placeholder="Scramble…" onChange={updateScramble} fullWidth/>
                    <IconButton disabled={error} onClick={submitScramble} variant='solid' color="primary" sx={{
                    }}>
                      <Search sx={{fontSize: '20px'}} />
                    </IconButton>
                  </Stack>
                  <MethodPicker selected={selected} click={click} depths={depths} setDepth={setDepth} setDepthAndSearch={setDepthAndSearch}></MethodPicker>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    
                  </Box>
                  <Stack direction="row" spacing={1} justifyContent="center" paddingTop={2} paddingBottom={1}>
                    { 
                      ['white', 'green', 'blue', 'red', 'orange', 'yellow'].map(color => 
                        <FaceColorButton key={color} color={color} checkedList={checkedColorList} onClick={(b) => colorClick(b, color)}/>
                      )
                    }
                  
                  </Stack>
                </Stack>
              </Card>
              <Sheet sx={{overflowY: 'auto', marginTop: '0px !Important', maxWidth:'360px',
              minWidth: '300px', width: "100%"}}>
                <Stack direction="column" width={"100%"} spacing={1} paddingTop={1} paddingBottom={1} sx={{overflowY: 'auto', boxSizing: 'border-box', paddingLeft: '2px', paddingRight: '3px'}}>
                  { !loading && solutions.filter(
                    solution => selected[solution.method] && checkedColorList[solution.color] && depths[solution.methodGroup] >= solution.depth && depths['ALG'] > solution.algNumber 
                    )
                    .slice(0, 50).map((solution, index) =>  
                    <SolutionCard key={index} color='green' {...solution} scramble={scramble} />
                    ) }
                    {/* loading false solitions 0 submitted */}
                  { !loading && solutions.filter(
                    solution => selected[solution.method] && checkedColorList[solution.color] && depths[solution.methodGroup] >= solution.depth && depths['ALG'] > solution.algNumber 
                    ).length === 0 && submitted && ( 
                      <Alert
                      sx={{ alignItems: 'flex-start' }}
                      variant="soft"
                      color='warning'
                      >
                      <div>
                        <div>No solutions found</div>
                        <Typography level="body-sm" color='warning'>
                          Try expanding your search parameters
                        </Typography>
                      </div>
                    </Alert>
                    ) }
                  {
                    !loading && !submitted && (
                      <Alert
                      sx={{ alignItems: 'flex-start' }}
                      variant="soft"
                      color='success'
                      >
                      <div>
                        <div>Enter a scramble!</div>
                        <Typography level="body-sm" color='success'>
                          Pick methods and more with the Settings button
                        </Typography>
                        <SkeletonSolutionCard />
                      </div>
                    </Alert>
                    )
                  }
                  {
                    loading &&
                      (<Stack direction="column" spacing={1} paddingTop={1}>
                        { [...Array(10)].map((x,y)=> (
                          <SkeletonSolutionCard key={y}></SkeletonSolutionCard>
                        ))}
                      </Stack>)
                  }
                </Stack>
              </Sheet>
              
          </Stack>
            </Box>
            </Stack>
        </Stack>
        
      </Sheet>
      

    </CssVarsProvider>
  );
}

export default App;

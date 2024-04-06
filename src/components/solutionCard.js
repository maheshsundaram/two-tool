import { Avatar, Card, CardOverflow, Chip, Link, Sheet, Stack, Typography } from "@mui/joy";
import { METHODS } from "../util/constants";
import { useTheme, IconButton, CardContent, Tooltip } from "@mui/joy";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import { useEffect, useState } from "react";

const SolutionCard = ({scramble, color, subset, inspection, face, alg, method, depth, algNumber, methodGroup, score, faceScore}) => {

    const theme = useTheme();
    
    const bgColor = theme.vars.palette[color][500];

    const [isCopying, setIsCopying] = useState(false); 

    const copyToClipboard = async () => {
        // method === METHODS.CLL ? 'layer' : 'face'
        const longest = Math.max(face.length, alg.length, 10);

        const scrambleLine = `${scramble}\n`;
        let inspectionLine = inspection.toLowerCase();
        for (var i = 0; i < (longest - inspection.length) / 3.75; i++) {
            inspectionLine += "\t";
        }
        inspectionLine += "\t\t\t// inspection\n";

        let faceLine = face;
        for (var i = 0; i < (longest - face.length) / 3.75; i++) {
            faceLine += "\t";
        }

        console.log(faceLine.length);

        faceLine += `\t\t\t// ${method === METHODS.CLL ? 'layer' : 'face'}\n`;

        let algLine = alg;
        console.log("tabs: " + (longest - alg.length)/3.75);
        for (var i = 0; i < 1 + ((longest - alg.length) /3.75); i++) {
            algLine += "\t";
        }
        console.log(algLine.length);

        algLine += `\t\t\t// ${method}\n`;

        const text = scrambleLine + inspectionLine + faceLine + algLine;

        try {
          await navigator.clipboard.writeText(text);
          console.log(text)
        } catch (error) {
          alert('Error copying to clipboard:' + error);
        }
        setIsCopying(true);
      };

    useEffect(() => {
        if (isCopying) {
            const timeoutId = setTimeout(() => {
                setIsCopying(false);
            }, 750);
            return () => clearTimeout(timeoutId);
        }
    }, [isCopying, setIsCopying]);

    return (
        <Card sx={{
            backgroundColor: 'background.level0',
            outlineWidth:"2px",
            boxSizing: "border-box",
            marginX: "2px",
            maxWidth: '360px',
            paddingY: "0",
            "&:hover": { boxShadow: "md !important", outline: "2px solid " + theme.vars.palette.theme1,
            backgroundColor: "background.level1",
            "& button": {
                display: "flex"
            }
        },

        }}>
            <CardContent 
            sx={{
            width: '100%',
            backgroundColor: 'background.level0',
            position: "relative",
        }}>
            <Link component="button" overlay={true} height={"100%"} width="100%" zIndex={10}></Link>
                <Tooltip title={isCopying? "Copied to clipboard" : "Copy"} variant="outlined" placement="left" color="neutral">
                    <IconButton
                    onClick={copyToClipboard}
                    sx={{
                        position: "absolute",
                        right: "-10px",
                        top: "1px",
                        zIndex: "10",
                        width: "0.8em",
                        height: "0.8em",
                        color: theme.vars.palette.theme1,
                        display: (isCopying ? "flex": "none")
                    }}
                    >
                        {
                            isCopying ? 
                            <LibraryAddCheckIcon
                                sx={{
                                    position: "absolute",
                                    width: "0.8em",
                                    height: "0.8em",
                                    color: theme.vars.palette.theme1
                                }}
                            ></LibraryAddCheckIcon>
                            :
                            <ContentCopyIcon
                                sx={{
                                    position: "absolute",
                                    width: "0.8em",
                                    height: "0.8em",
                                    color: theme.vars.palette.theme1
                                }}
                            ></ContentCopyIcon>
                        }
                    </IconButton>
                </Tooltip>
                <Stack
                direction="column"
                justifyContent="flex-start"
                alignItems="center"
                width={"100%"}
                spacing={0}
                paddingBottom={1}
                >
                    <Stack
                    direction="row"
                    width="100%"
                    marginBottom="10px"
                    justifyContent="center"
                    position="relative"
                    >
                        <Link
                            underline="none"
                            zIndex="10"
                            sx={{ marginTop: '0.25rem !important' }}
                        >
                            <Chip
                            disabled={false}
                            variant="outlined"
                            ><Typography level="title-sm">{method} &bull; {subset}</Typography>
                            </Chip>
                        </Link>
                    </Stack>
                    <Stack 
                    direction="column"
                    spacing={0}
                    sx={{ width: '100%'}}
                    >
                        <Stack 
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        >   
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Sheet className="circle" sx={{borderColor: '#BDBDBD !important'}}></Sheet>
                                <Typography textTransform='lowercase' level="body-sm">
                                    {inspection}
                                </Typography>
                            </Stack>
                            <Typography level="body-sm">
                                // inspection {score}
                            </Typography>
                        </Stack>
                        <Stack 
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Sheet className="circle" sx={{borderColor: bgColor + ' !important', outline: color === 'white' ? '1px solid black' : 'none', backgroundColor: color === 'white' ? 'black !important' : 'none'}}></Sheet>
                                <Typography level="body-sm">
                                    {face}
                                </Typography>
                            </Stack>
                            <Typography level="body-sm">
                                // { method === METHODS.CLL ? 'layer' : 'face' }
                            </Typography>
                        </Stack>
                        <Stack 
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Sheet className="circle" sx={{backgroundColor: bgColor + ' !important', borderColor: bgColor + ' !important', outline: color === 'white' ? '1px solid black' : 'none'}}></Sheet>
                                <Typography level="body-sm">
                                    {alg}
                                </Typography>
                            </Stack>
                            <Typography level="body-sm">
                                // {method}
                            </Typography>
                        </Stack>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default SolutionCard;
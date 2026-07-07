import { Divider, IconButton, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import GitHubIcon from '@mui/icons-material/GitHub';
export default function Footer() {
  const theme = useTheme();

  return (
    <footer
      className="mt-20 border-t"
      style={{
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.grey[200],
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <img src="/logo.png" alt="Ticki" className="h-12 w-auto "></img>
          </div>

          {/* Support */}
          <div>
            <Typography sx={{ mt: 6 ,mb:2}} fontWeight={600} mb={2}>
              خدمات مشتریان
            </Typography>

            <div className="flex flex-col gap-2">
              <Link href="#" underline="hover" color="text.secondary">
                پشتیبانی
              </Link>

              <Link  href="#" underline="hover" color="text.secondary">
                پرسش و پاسخ
              </Link>

              <Link href="#" underline="hover" color="text.secondary">
                قوانین و مقررات
              </Link>

              
            </div>
           <IconButton fontSize="large">
            <GitHubIcon/>
           </IconButton>
          </div>
        </div>

        <Divider sx={{ my: 4 }} />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Typography sx={{mr:6}} color="text.secondary">
            ©2026  استفاده از مطالب این وب سایت فقط برای مقاصد غیر تجاری و
            با ذکر منبع بلامانع است. کلیه حقوق این سایت متعلق به تیکی
            می‌باشد.{" "}
          </Typography>
        </div>
      </div>
    </footer>
  );
}